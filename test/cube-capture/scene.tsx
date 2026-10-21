import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '#test-fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
import * as THREE from '#three'
import { RenderTarget } from '#drei-platform'
import { RenderCubeTexture } from '#test-cube'

const frames = Number(new URLSearchParams(location.search).get('frames'))
const cube = React.createRef<any>()
const material = React.createRef<any>()
const result: any = { errors: [], captures: 0, samples: [] }
;(window as any).result = result
let rerender: () => void

function Probe() {
  const { renderer, scene, camera, invalidate, setFrameloop } = useThree()
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
    r.render = function (s: any, c: any) {
      if (s === cube.current?.scene) result.captures++
      return original.call(this, s, c)
    }
    ;(window as any).step = (color: string) => {
      cube.current.scene.background = new THREE.Color(color)
      return new Promise((resolve) => {
        data.pending = resolve
        setFrameloop('demand')
        invalidate()
      })
    }
    ;(window as any).rerender = rerender
    result.ready = true
    return () => {
      r.render = original
      data.output.dispose()
    }
  }, [renderer, data])

  useFrame(
    () => {
      if (!data.pending) return
      const resolve = data.pending
      data.pending = null
      const target = renderer.getRenderTarget()
      renderer.setRenderTarget(data.output)
      renderer.render(scene, camera)
      renderer.setRenderTarget(target)
      setFrameloop('never')
      const r: any = renderer
      const read = r.isWebGLRenderer
        ? r.readRenderTargetPixelsAsync(data.output, 8, 8, 1, 1, new Uint8Array(4))
        : r.readRenderTargetPixelsAsync(data.output, 8, 8, 1, 1)
      Promise.resolve(read)
        .then((pixel) => {
          const sample = {
            pixel: Array.from(pixel as ArrayLike<number>),
            captures: result.captures,
            published: material.current.envMap === cube.current.fbo.texture,
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
  rerender = () => setVersion((value) => value + 1)
  return (
    <Canvas frameloop="never" dpr={1} camera={{ position: [0, 0, 5] }}>
      <Probe />
      <mesh>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial ref={material}>
          <RenderCubeTexture ref={cube} frames={frames} resolution={16} attach="envMap" flip>
            <color attach="background" args={['red']} />
          </RenderCubeTexture>
        </meshBasicMaterial>
      </mesh>
    </Canvas>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
