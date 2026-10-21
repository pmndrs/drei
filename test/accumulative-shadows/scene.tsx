import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '#test-fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
import * as THREE from '#three'
import { RenderTarget, CubeRenderTarget } from '#drei-platform'
import { AccumulativeShadows } from '#test-accumulative'

const scenario = new URLSearchParams(location.search).get('scenario') || 'bound'
const imperative = !['bound', 'default'].includes(scenario)
const cube = scenario.startsWith('cube-')
const mip = scenario.startsWith('mip-')
const face = cube ? 3 : 0
const level = mip ? 1 : 0
const result: any = { scenario, targets: [], subresources: [], renders: [], checks: [], errors: [] }
;(window as any).result = result

function Probe({ shadows, mesh, light }: { shadows: any; mesh: any; light: any }) {
  const renderer: any = useThree((state) => state.renderer)
  const scene = useThree((state) => state.scene)
  const data = React.useMemo(
    () => ({
      outer: cube
        ? new CubeRenderTarget(8, { type: THREE.UnsignedByteType })
        : new RenderTarget(8, 8, { type: THREE.UnsignedByteType, generateMipmaps: mip }),
      continuation: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
      frame: 0,
      renders: 0,
      busy: false,
    }),
    []
  )

  React.useLayoutEffect(() => {
    renderer.setClearColor('orange', 0.25)
    result.backend = renderer.backend?.isWebGPUBackend ? 'WebGPU' : renderer.isWebGLRenderer ? 'WebGL' : 'fallback'
    if (renderer.isWebGLRenderer) {
      const context = renderer.getContext()
      const info = context.getExtension('WEBGL_debug_renderer_info')
      result.adapter = info && context.getParameter(info.UNMASKED_RENDERER_WEBGL)
    } else {
      result.adapter = renderer.backend.device?.adapterInfo?.description
      renderer.backend.device?.addEventListener('uncapturederror', (event: any) => {
        result.errors.push(event.error.message)
      })
    }
    const originalRender = renderer.render
    renderer.render = function (...args: any[]) {
      data.renders++
      return originalRender.apply(this, args)
    }
    return () => {
      renderer.render = originalRender
      data.outer.dispose()
    }
  }, [renderer, data])

  useFrame(
    () => {
      if (data.busy) return
      data.frame++
      renderer.setRenderTarget(data.outer, face)
      data.continuation.background = new THREE.Color('red')
      renderer.render(data.continuation, data.camera)
      const expected = scenario === 'default' ? null : data.outer
      renderer.setRenderTarget(expected, face, level)
      data.renders = 0

      if (!imperative) return
      if (data.frame === 1 || data.frame === 3) {
        // Warm up, and prove the same accumulator can be used after a failure/reset.
        shadows.current.update()
      } else if (data.frame === 2) {
        const plane = shadows.current.getMesh()
        const before = {
          background: scene.background,
          material: mesh.current.material,
          planeMaterial: plane.material,
          frustumCulled: plane.frustumCulled,
          intensity: light.current.intensity,
          clearColor: renderer.getClearColor(new THREE.Color()),
          clearAlpha: renderer.getClearAlpha(),
        }
        const originalBeforeRender = mesh.current.onBeforeRender
        const originalClear = renderer.clear
        if (scenario === 'render-error') {
          mesh.current.onBeforeRender = () => {
            throw new Error('render sentinel')
          }
        } else if (scenario === 'light-error') {
          shadows.current.lights.set('sentinel', {
            update: () => {
              throw new Error('light sentinel')
            },
          })
        } else if (scenario === 'clear-error') {
          renderer.clear = () => {
            throw new Error('clear sentinel')
          }
        }
        let caught: string | undefined
        try {
          if (scenario === 'reset' || scenario === 'clear-error' || scenario.endsWith('-reset')) shadows.current.reset()
          else shadows.current.update()
        } catch (error) {
          caught = (error as Error).message
        } finally {
          mesh.current.onBeforeRender = originalBeforeRender
          renderer.clear = originalClear
          shadows.current.lights.delete('sentinel')
        }
        result.caught = caught
        result.checks.push({
          target: renderer.getRenderTarget() === expected,
          cubeFace: renderer.getActiveCubeFace() === face,
          mipLevel: renderer.getActiveMipmapLevel() === level,
          background: scene.background === before.background,
          material: mesh.current.material === before.material,
          planeMaterial: plane.material === before.planeMaterial,
          frustumCulled: plane.frustumCulled === before.frustumCulled,
          intensity: light.current.intensity === before.intensity,
          lightsHidden: plane.parent.children[0].visible === false,
          clearColor: renderer.getClearColor(new THREE.Color()).equals(before.clearColor),
          clearAlpha: renderer.getClearAlpha() === before.clearAlpha,
        })
      }
    },
    { phase: 'update', priority: 1000 }
  )

  useFrame(
    () => {
      if (data.busy) return
      result.targets.push(renderer.getRenderTarget() === (scenario === 'default' ? null : data.outer))
      result.subresources.push(renderer.getActiveCubeFace() === face && renderer.getActiveMipmapLevel() === level)
      result.renders.push(data.renders)
      data.continuation.background = new THREE.Color('lime')
      renderer.render(data.continuation, data.camera)
      if (data.frame === 4) {
        data.busy = true
        // WebGL cube readback cannot restore a cube's framebuffer array as one FBO.
        if (cube) renderer.setRenderTarget(null)
        const read = renderer.isWebGLRenderer
          ? renderer.readRenderTargetPixelsAsync(data.outer, 4, 4, 1, 1, new Uint8Array(4), face)
          : renderer.readRenderTargetPixelsAsync(data.outer, 4, 4, 1, 1, 0, face)
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
  const shadows = React.useRef(null)
  const mesh = React.useRef(null)
  const light = React.useRef(null)
  return (
    <Canvas camera={{ position: [0, 2, 5] }} dpr={1} frameloop="always">
      <color attach="background" args={['navy']} />
      <Probe shadows={shadows} mesh={mesh} light={light} />
      <AccumulativeShadows
        ref={shadows}
        temporal
        frames={imperative ? Infinity : 2}
        limit={imperative ? 0 : Infinity}
        resolution={16}
      />
      <ambientLight ref={light} intensity={3} />
      <mesh ref={mesh}>
        <boxGeometry />
        <meshBasicMaterial color="blue" />
      </mesh>
    </Canvas>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
