import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '#test-fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
import * as THREE from '#three'
import { RenderTarget, CubeRenderTarget } from '#drei-platform'
import { Caustics } from '#test-caustics'

const scenario = new URLSearchParams(location.search).get('scenario') || 'bound'
const frames = scenario === 'zero' ? 0 : scenario === 'finite' ? 1 : Infinity
const causticsOnly = scenario === 'only' || scenario === 'error'
const face = scenario === 'cube' ? 3 : 0
const level = scenario === 'mip' ? 1 : 0
const result: any = {
  scenario,
  targets: [],
  subresources: [],
  transforms: [],
  scenes: [],
  visibility: [],
  renders: [],
  errors: [],
}
;(window as any).result = result

function Probe({ capture }: { capture: any }) {
  const renderer: any = useThree((state) => state.renderer)
  const data = React.useMemo(
    () => ({
      outer:
        scenario === 'cube'
          ? new CubeRenderTarget(16, { type: THREE.UnsignedByteType })
          : new RenderTarget(16, 16, { type: THREE.UnsignedByteType, generateMipmaps: scenario === 'mip' }),
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
      override: new THREE.MeshBasicMaterial({ color: 'teal' }),
      world: new THREE.Matrix4(),
      frame: 0,
      renders: 0,
      busy: false,
    }),
    []
  )
  React.useLayoutEffect(() => {
    result.backend = renderer.backend?.isWebGPUBackend ? 'WebGPU' : renderer.isWebGLRenderer ? 'WebGL' : 'fallback'
    if (renderer.isWebGLRenderer) {
      const context = renderer.getContext()
      const info = context.getExtension('WEBGL_debug_renderer_info')
      result.adapter = info && context.getParameter(info.UNMASKED_RENDERER_WEBGL)
    } else {
      renderer.backend.device?.addEventListener('uncapturederror', (event: any) =>
        result.errors.push(event.error.message)
      )
    }
    const original = renderer.render
    renderer.render = function (...args: any[]) {
      data.renders++
      return original.apply(this, args)
    }
    return () => {
      renderer.render = original
      data.outer.dispose()
      data.override.dispose()
    }
  }, [renderer, data])

  useFrame(
    () => {
      if (data.busy) return
      data.frame++
      capture.current.updateWorldMatrix(true, true)
      data.world.copy(capture.current.matrixWorld)
      const scene = capture.current.children.find((child: any) => child.isScene)
      scene.overrideMaterial = data.override
      scene.visible = scenario !== 'default'
      renderer.setRenderTarget(data.outer, face)
      data.scene.background = new THREE.Color('red')
      renderer.render(data.scene, data.camera)
      renderer.setRenderTarget(scenario === 'default' ? null : data.outer, face, level)
      data.renders = 0
    },
    { phase: 'update', priority: 1000 }
  )

  useFrame(
    () => {
      if (data.busy) return
      const scene = capture.current.children.find((child: any) => child.isScene)
      result.targets.push(renderer.getRenderTarget() === (scenario === 'default' ? null : data.outer))
      result.subresources.push(renderer.getActiveCubeFace() === face && renderer.getActiveMipmapLevel() === level)
      result.transforms.push(capture.current.matrixWorld.equals(data.world))
      result.scenes.push(scene.overrideMaterial === data.override)
      result.visibility.push(scene.visible === (!causticsOnly && scenario !== 'default'))
      result.renders.push(data.renders)
      if (scenario === 'error') {
        result.done = data.busy = true
        renderer.setRenderTarget(null)
        return
      }
      data.scene.background = new THREE.Color('lime')
      renderer.render(data.scene, data.camera)
      if (data.frame === 3) {
        data.busy = true
        if (scenario === 'cube') renderer.setRenderTarget(null)
        const read = renderer.isWebGLRenderer
          ? renderer.readRenderTargetPixelsAsync(data.outer, 8, 8, 1, 1, new Uint8Array(4), face)
          : renderer.readRenderTargetPixelsAsync(data.outer, 8, 8, 1, 1, 0, face)
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

function App() {
  const capture = React.useRef(null)
  return (
    <Canvas camera={{ position: [0, 3, 6] }} dpr={1} frameloop="always">
      <Probe capture={capture} />
      <Caustics
        ref={capture}
        position={[2, 0, 1]}
        frames={frames}
        resolution={16}
        causticsOnly={causticsOnly}
        backside={scenario === 'only'}
      >
        <mesh
          position={[0, 1, 0]}
          onBeforeRender={() => {
            if (scenario === 'error' && !result.injected) {
              result.injected = true
              throw new Error('Expected caustics render failure')
            }
          }}
        >
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      </Caustics>
    </Canvas>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
