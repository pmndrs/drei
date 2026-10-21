import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '#test-fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
import * as THREE from '#three'
import { RenderTarget } from '#drei-platform'
import { RenderTexture } from '#test-texture'

const params = new URLSearchParams(location.search)
const frames = Number(params.get('frames'))
const binding = params.get('binding') || 'map'
const texture = React.createRef<THREE.Texture>()
const material = React.createRef<any>()
const initial = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
initial.needsUpdate = true
const result: any = { errors: [], captures: 0, samples: [], assigned: 0, cleaned: 0 }
;(window as any).result = result
let portalScene: THREE.Scene
let captured: THREE.Texture | undefined
let callbackTexture: THREE.Texture | null
let rerender: () => void
let remove: () => void

const callbackRef = (value: THREE.Texture | null) => {
  callbackTexture = value
  if (value) {
    result.assigned++
    return () => {
      result.cleaned++
      callbackTexture = null
    }
  }
}
const callbackAttach = (parent: any, value: THREE.Texture) => {
  const previous = parent.map
  parent.map = value
  return () => {
    parent.map = previous
  }
}

function PortalScene() {
  portalScene = useThree((state) => state.scene)
  return (
    <>
      <color attach="background" args={['red']} />
      {binding === 'throw' && (
        <mesh
          position={[100, 100, 100]}
          frustumCulled={false}
          onBeforeRender={() => {
            if (!result.thrown) {
              result.thrown = true
              throw new Error('texture-capture-test-error')
            }
          }}
        >
          <boxGeometry />
          <meshBasicMaterial />
        </mesh>
      )}
    </>
  )
}

function Probe() {
  const { renderer, scene, camera, invalidate, setFrameloop, get, set } = useThree()
  const data = React.useMemo(
    () => ({
      output: new RenderTarget(16, 16, { type: THREE.UnsignedByteType }),
      pending: null as null | ((value: any) => void),
    }),
    []
  )
  React.useLayoutEffect(() => {
    const r: any = renderer
    result.backend = r.backend?.isWebGPUBackend ? 'WebGPU' : r.isWebGLRenderer ? 'WebGL' : 'fallback'
    r.backend?.device?.addEventListener('uncapturederror', (event: any) => result.errors.push(event.error.message))
    const original = r.render
    const setError = get().setError
    set({
      setError: (error: Error) => {
        if (error.message === 'texture-capture-test-error') result.caught = true
        else setError(error)
      },
    })
    r.render = function (s: any, c: any) {
      const value = original.call(this, s, c)
      if (s === portalScene) {
        result.captures++
        captured = r.getRenderTarget().texture
      }
      return value
    }
    ;(window as any).step = (color: string) => {
      portalScene.background = new THREE.Color(color)
      renderer.autoClear = false
      return new Promise((resolve) => {
        data.pending = resolve
        setFrameloop('demand')
        invalidate()
      })
    }
    ;(window as any).rerender = rerender
    ;(window as any).remove = async () => {
      remove()
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return {
        restored: (binding === 'path' ? material.current.userData.portal.value : material.current.map) === initial,
        refCleared: binding === 'callback' ? callbackTexture == null : texture.current == null,
        refBalanced: result.assigned === result.cleaned,
      }
    }
    result.ready = true
    return () => {
      r.render = original
      set({ setError })
      data.output.dispose()
      initial.dispose()
    }
  }, [renderer, data])

  useFrame(
    () => {
      if (!data.pending) return
      const resolve = data.pending
      data.pending = null
      if (binding === 'path') material.current.map = material.current.userData.portal.value
      const target = renderer.getRenderTarget()
      const stateRestored = target === null && renderer.autoClear === false
      renderer.setRenderTarget(data.output)
      renderer.clear()
      renderer.render(scene, camera)
      renderer.setRenderTarget(target)
      setFrameloop('never')
      renderer.autoClear = true
      const r: any = renderer
      const read = r.isWebGLRenderer
        ? r.readRenderTargetPixelsAsync(data.output, 8, 8, 1, 1, new Uint8Array(4))
        : r.readRenderTargetPixelsAsync(data.output, 8, 8, 1, 1)
      Promise.resolve(read)
        .then((pixel) => {
          const displayed = material.current.map
          const sample = {
            pixel: Array.from(pixel as ArrayLike<number>),
            captures: result.captures,
            published:
              displayed === captured && displayed === (binding === 'callback' ? callbackTexture : texture.current),
            properties: displayed.minFilter === THREE.NearestFilter && displayed.wrapS === THREE.RepeatWrapping,
            version: material.current.version,
            stateRestored,
          }
          result.samples.push(sample)
          resolve(sample)
        })
        .catch((error) => {
          result.errors.push(String(error))
          resolve(null)
        })
    },
    { phase: 'render', priority: 1000 }
  )
  return null
}

function App() {
  const [, setVersion] = React.useState(0)
  const [show, setShow] = React.useState(true)
  const userData = React.useMemo(() => ({ portal: { value: initial } }), [])
  rerender = () => setVersion((value) => value + 1)
  remove = () => setShow(false)
  return (
    <Canvas frameloop="never" dpr={1} camera={{ position: [0, 0, 5] }}>
      <Probe />
      <mesh>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial ref={material} map={initial} userData={userData}>
          {show && (
            <RenderTexture
              ref={binding === 'callback' ? callbackRef : texture}
              frames={frames}
              width={16}
              height={16}
              samples={0}
              minFilter={THREE.NearestFilter}
              wrapS={THREE.RepeatWrapping}
              attach={binding === 'callback' ? callbackAttach : binding === 'path' ? 'userData-portal-value' : 'map'}
            >
              <PortalScene />
            </RenderTexture>
          )}
        </meshBasicMaterial>
      </mesh>
    </Canvas>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
