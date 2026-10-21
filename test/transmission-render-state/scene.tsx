import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '#test-fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
import * as THREE from '#three'
import { RenderTarget } from '#drei-platform'
import { MeshTransmissionMaterial } from '#test-transmission'
import { RenderTexture } from '@core/Portal/RenderTexture'
import { createPostProcessing } from '#test-post-processing'

const params = new URLSearchParams(location.search)
const scenario = params.get('scenario') || 'bound'
const backside = params.get('backside') === 'true'
const throwPass = Number(params.get('throwPass') || 0)
const result: any = { scenario, backside, throwPass, targets: [], states: [], renders: [], errors: [] }
;(window as any).result = result
const transmission = React.createRef<any>()
const mesh = React.createRef<any>()
const background = new THREE.Color('blue')
let candidateScene: THREE.Scene

function Candidate() {
  candidateScene = useThree((state) => state.scene)
  const materials = React.useMemo(() => [new THREE.MeshBasicMaterial()], [])
  React.useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])
  return (
    <mesh ref={mesh} material={scenario === 'array' ? materials : undefined}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <MeshTransmissionMaterial
        ref={transmission}
        attach={scenario === 'array' ? 'material-0' : 'material'}
        resolution={32}
        samples={1}
        backside={backside}
        thickness={0.2}
        backsideThickness={0.4}
        side={THREE.DoubleSide}
        background={background}
      />
    </mesh>
  )
}

function Probe() {
  const { renderer, scene, camera, get, set } = useThree()
  const data = React.useMemo(() => {
    const outer = new RenderTarget(16, 16, { type: THREE.UnsignedByteType })
    const continuation = new THREE.Scene()
    continuation.background = new THREE.Color('red')
    const post = createPostProcessing(renderer, outer)
    return { outer, continuation, post, frame: 0, count: 0, done: false, originalMaterial: null as any }
  }, [renderer])

  React.useLayoutEffect(() => {
    const r: any = renderer
    result.backend = r.backend?.isWebGPUBackend ? 'WebGPU' : r.isWebGLRenderer ? 'WebGL' : 'fallback'
    result.adapter = r.backend?.device?.adapterInfo
    r.backend?.device?.addEventListener('uncapturederror', (event: any) => result.errors.push(event.error.message))
    const original = r.render
    const setError = get().setError
    set({
      setError: (error: Error) => {
        if (error.message === 'transmission-test-injected-error') result.caught = true
        else setError(error)
      },
    })
    r.render = function (s: any, c: any) {
      if (s === candidateScene && r.getRenderTarget() && r.getRenderTarget() !== data.outer) {
        data.count++
        if (throwPass && data.count === throwPass) {
          result.thrown = true
          throw new Error('transmission-test-injected-error')
        }
      }
      return original.call(this, s, c)
    }
    return () => {
      r.render = original
      set({ setError })
      data.outer.dispose()
      data.post.dispose()
    }
  }, [renderer, scene, data])

  useFrame(
    () => {
      if (data.done) return
      data.frame++
      data.count = 0
      data.originalMaterial = mesh.current.material
      renderer.setRenderTarget(data.outer)
      data.continuation.background.set('red')
      renderer.render(data.continuation, camera)
      renderer.setRenderTarget(scenario === 'default' ? null : data.outer)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
    },
    { phase: 'update', priority: 1000 }
  )

  useFrame(
    () => {
      if (data.done) return
      result.targets.push(renderer.getRenderTarget() === (scenario === 'default' ? null : data.outer))
      result.renders.push(data.count)
      result.states.push({
        material: mesh.current.material === data.originalMaterial,
        background: candidateScene.background === null,
        toneMapping: renderer.toneMapping === THREE.ACESFilmicToneMapping,
        side: transmission.current.side === THREE.DoubleSide,
        thickness: transmission.current.thickness === 0.2,
      })
      data.continuation.background.set('lime')
      renderer.render(data.continuation, camera)
      if (data.frame === (throwPass ? 1 : 3)) {
        data.done = true
        data.post.render()
        const output = data.post.output()
        const r: any = renderer
        const read = r.isWebGLRenderer
          ? r.readRenderTargetPixelsAsync(output, 8, 8, 1, 1, new Uint8Array(4))
          : r.readRenderTargetPixelsAsync(output, 8, 8, 1, 1)
        Promise.resolve(read)
          .then((pixel) => {
            result.pixel = Array.from(pixel as ArrayLike<number>)
            result.done = true
          })
          .catch((error) => {
            result.errors.push(String(error))
            result.done = true
          })
      }
      renderer.setRenderTarget(null)
    },
    { phase: 'render', priority: 1000 }
  )
  return null
}

createRoot(document.getElementById('root')!).render(
  <Canvas camera={{ position: [0, 0, 5] }} dpr={1}>
    <Probe />
    {scenario === 'nested' ? (
      <mesh>
        <planeGeometry />
        <meshBasicMaterial>
          <RenderTexture width={32} height={32} samples={0}>
            <Candidate />
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>
    ) : (
      <Candidate />
    )}
    <ambientLight intensity={1} />
  </Canvas>
)
