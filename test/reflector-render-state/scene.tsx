import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber/legacy'
import { useFrame, useThree } from '@react-three/fiber/extension'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@legacy/Materials/MeshReflectorMaterial'
import { createPostProcessing } from './post-processing-webgl'

const params = new URLSearchParams(location.search)
const scenario = params.get('scenario') || 'bound'
const blur = params.get('blur') === 'true'
const throwPass = Number(params.get('throwPass') || 0)
const marker = 'reflector-test-injected-error'
const result: any = { scenario, blur, throwPass, targets: [], states: [], renders: [], errors: [] }
;(window as any).result = result
const mirror = React.createRef<THREE.Mesh>()

function Probe() {
  const { renderer, camera, get, set } = useThree()
  const r = renderer as THREE.WebGLRenderer
  const data = React.useMemo(() => {
    const outer =
      scenario === 'cube'
        ? new THREE.WebGLCubeRenderTarget(16, { type: THREE.UnsignedByteType })
        : new THREE.WebGLRenderTarget(16, 16, { type: THREE.UnsignedByteType, generateMipmaps: scenario === 'mip' })
    const continuation = new THREE.Scene()
    continuation.background = new THREE.Color('red')
    const post = scenario === 'cube' || scenario === 'mip' ? null : createPostProcessing(r, outer)
    return { outer, continuation, post, frame: 0, count: 0, done: false }
  }, [r])
  React.useLayoutEffect(() => {
    result.backend = r.isWebGLRenderer ? 'WebGL' : 'unexpected'
    const original = r.render
    const setError = get().setError
    set({
      setError: (error: Error) => {
        if (error.message === marker) result.caught = true
        else setError(error)
      },
    })
    r.render = function (scene, camera) {
      if (this.getRenderTarget() && this.getRenderTarget() !== data.outer) {
        data.count++
        if (throwPass && data.count === throwPass) {
          result.thrown = true
          throw new Error(marker)
        }
      }
      return original.call(this, scene, camera)
    }
    return () => {
      r.render = original
      set({ setError })
      data.outer.dispose()
      data.post?.dispose()
    }
  }, [r, data])
  useFrame(
    () => {
      if (data.done) return
      data.frame++
      data.count = 0
      r.setRenderTarget(data.outer, scenario === 'cube' ? 3 : 0)
      data.continuation.background!.set('red')
      r.render(data.continuation, camera)
      r.setRenderTarget(
        scenario === 'default' ? null : data.outer,
        scenario === 'cube' ? 3 : 0,
        scenario === 'mip' ? 1 : 0
      )
      r.xr.enabled = true
      r.shadowMap.autoUpdate = true
    },
    { phase: 'update', priority: 1000 }
  )
  useFrame(
    () => {
      if (data.done) return
      result.targets.push(r.getRenderTarget() === (scenario === 'default' ? null : data.outer))
      result.states.push({
        face: r.getActiveCubeFace() === (scenario === 'cube' ? 3 : 0),
        mip: r.getActiveMipmapLevel() === (scenario === 'mip' ? 1 : 0),
        visible: mirror.current?.visible === (scenario !== 'hidden'),
        xr: r.xr.enabled === true,
        shadows: r.shadowMap.autoUpdate === true,
      })
      result.renders.push(data.count)
      data.continuation.background!.set('lime')
      r.render(data.continuation, camera)
      if (data.frame === (throwPass ? 1 : 3)) {
        data.done = true
        if (scenario === 'mip') {
          result.done = true
          r.setRenderTarget(null)
          return
        }
        data.post?.render()
        if (scenario === 'cube') r.setRenderTarget(null)
        const output = data.post ? data.post.output() : data.outer
        r.readRenderTargetPixelsAsync(output, 8, 8, 1, 1, new Uint8Array(4), scenario === 'cube' ? 3 : 0)
          .then((pixel) => {
            result.pixel = Array.from(pixel)
            result.done = true
          })
          .catch((error) => {
            result.errors.push(String(error))
            result.done = true
          })
      }
      r.setRenderTarget(null)
    },
    { phase: 'render', priority: 1000 }
  )
  return null
}

createRoot(document.getElementById('root')!).render(
  <Canvas camera={{ position: [0, 0, 5] }} dpr={1}>
    <Probe />
    <mesh ref={mirror} visible={scenario !== 'hidden'}>
      <planeGeometry args={[2, 2]} />
      <MeshReflectorMaterial resolution={32} blur={blur ? [16, 16] : 0} />
    </mesh>
    <mesh position={[0, 0, 1]}>
      <boxGeometry />
      <meshBasicMaterial color="blue" />
    </mesh>
    <ambientLight />
  </Canvas>
)
