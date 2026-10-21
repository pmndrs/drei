import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '#test-fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
import * as THREE from '#three'
import { RenderTarget, CubeRenderTarget } from '#drei-platform'
import { useDepthBuffer } from '@core/Helpers/useDepthBuffer'
import { RenderTexture } from '@core/Portal/RenderTexture'
import { ContactShadows } from '#test-contact-shadows'
import { useDepthBuffer as useGpuDepthBuffer } from '#test-depth-buffer'
import { createPostProcessing } from '#test-post-processing'

const params = new URLSearchParams(location.search)
const component = params.get('component') || 'depth'
const scenario = params.get('scenario') || 'bound'
const frames = Number(params.get('frames') || Infinity)
const expectedCaptureError = 'Expected offscreen capture failure'
const result: any = {
  component,
  scenario,
  frames: String(frames),
  targets: [],
  subresources: [],
  clears: [],
  scenes: [],
  visibility: [],
  renders: [],
  errors: [],
}
;(window as any).result = result

function Depth({ gpu = false }: { gpu?: boolean }) {
  const hook = gpu ? useGpuDepthBuffer : useDepthBuffer
  hook({ size: 32, frames })
  return null
}

function Candidate() {
  return component === 'contact' ? (
    <ContactShadows
      name="capture-candidate"
      visible={scenario !== 'hidden'}
      resolution={32}
      frames={frames}
      position={[0, -1, 0]}
    />
  ) : (
    <Depth gpu={component === 'gpu-depth'} />
  )
}

function Nested() {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial>
        <RenderTexture width={32} height={32} samples={0}>
          <mesh>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial>
              <RenderTexture width={16} height={16} samples={0}>
                <Candidate />
                <mesh>
                  <boxGeometry />
                  <meshBasicMaterial color="blue" />
                </mesh>
              </RenderTexture>
            </meshBasicMaterial>
          </mesh>
        </RenderTexture>
      </meshBasicMaterial>
    </mesh>
  )
}

function Probe() {
  const renderer: any = useThree((state) => state.renderer)
  const rootScene = useThree((state) => state.scene)
  const data = React.useMemo(() => {
    const outer =
      scenario === 'cube'
        ? new CubeRenderTarget(16, { type: THREE.UnsignedByteType })
        : new RenderTarget(16, 16, { type: THREE.UnsignedByteType, generateMipmaps: scenario === 'mip' })
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('red')
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const post = scenario === 'cube' || scenario === 'mip' ? null : createPostProcessing(renderer, outer)
    return {
      outer,
      scene,
      camera,
      post,
      clearColor: new THREE.Color(),
      frame: 0,
      renderCount: 0,
      busy: false,
      background: new THREE.Color('navy'),
      overrideMaterial: new THREE.MeshBasicMaterial({ color: 'teal' }),
    }
  }, [renderer])

  React.useLayoutEffect(() => {
    result.backend = renderer.backend?.isWebGPUBackend ? 'WebGPU' : renderer.isWebGLRenderer ? 'WebGL' : 'fallback'
    if (renderer.isWebGLRenderer) {
      const gl = renderer.getContext()
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      result.adapter = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    } else {
      const info = renderer.backend.device?.adapterInfo
      result.adapter = info && {
        vendor: info.vendor,
        architecture: info.architecture,
        device: info.device,
        description: info.description,
      }
      renderer.backend.device?.addEventListener('uncapturederror', (event: any) => {
        result.errors.push(event.error.message)
      })
    }
    const original = renderer.render
    const originalBackground = rootScene.background
    const originalOverrideMaterial = rootScene.overrideMaterial
    if (scenario === 'error') {
      rootScene.background = data.background
      rootScene.overrideMaterial = data.overrideMaterial
    }
    renderer.render = function (...args: any[]) {
      data.renderCount++
      return original.apply(this, args)
    }
    return () => {
      renderer.render = original
      rootScene.background = originalBackground
      rootScene.overrideMaterial = originalOverrideMaterial
      data.overrideMaterial.dispose()
      data.outer.dispose()
      data.post?.dispose()
    }
  }, [renderer, rootScene, data])

  // Simulate an outer pass retaining a target across R3F callbacks, as in #2832.
  useFrame(
    () => {
      if (data.busy) return
      data.frame++
      renderer.setRenderTarget(data.outer, scenario === 'cube' ? 3 : 0)
      data.scene.background.set('red')
      renderer.render(data.scene, data.camera)
      renderer.setRenderTarget(
        scenario === 'default' ? null : data.outer,
        scenario === 'cube' ? 3 : 0,
        scenario === 'mip' ? 1 : 0
      )
      renderer.setClearColor('red', 0.25)
      data.renderCount = 0
    },
    { phase: 'update', priority: 1000 }
  )

  // Runs after update/depthCapture and before R3F's main canvas render.
  useFrame(
    () => {
      if (data.busy) return
      const expected = scenario === 'default' ? null : data.outer
      result.targets.push(renderer.getRenderTarget() === expected)
      result.subresources.push(
        renderer.getActiveCubeFace() === (scenario === 'cube' ? 3 : 0) &&
          renderer.getActiveMipmapLevel() === (scenario === 'mip' ? 1 : 0)
      )
      result.clears.push(
        renderer.getClearColor(data.clearColor).getHexString() === 'ff0000' && renderer.getClearAlpha() === 0.25
      )
      if (scenario === 'error') {
        result.scenes.push(
          rootScene.background === data.background && rootScene.overrideMaterial === data.overrideMaterial
        )
      }
      if (component === 'contact' && (scenario === 'error' || scenario === 'hidden')) {
        result.visibility.push(rootScene.getObjectByName('capture-candidate')?.visible === (scenario !== 'hidden'))
      }
      result.renders.push(data.renderCount)
      if (scenario === 'error') {
        data.busy = true
        result.done = true
        renderer.setRenderTarget(null)
        return
      }
      // A continuation must draw green into the caller's target, not the canvas.
      data.scene.background.set('lime')
      renderer.render(data.scene, data.camera)
      if (data.frame === 6) {
        data.busy = true
        const current = renderer.getRenderTarget()
        data.post?.render()
        result.postRestoredTarget = renderer.getRenderTarget() === current
        if (scenario === 'mip') {
          result.done = true
          renderer.setRenderTarget(null)
          return
        }
        const output = data.post ? data.post.output() : data.outer
        // Finish the outer pass before readback; WebGL's async cube readback
        // otherwise tries to restore the cube's framebuffer array as one FBO.
        if (scenario === 'cube') renderer.setRenderTarget(null)
        const read = renderer.isWebGLRenderer
          ? renderer.readRenderTargetPixelsAsync(output, 8, 8, 1, 1, new Uint8Array(4), scenario === 'cube' ? 3 : 0)
          : renderer.readRenderTargetPixelsAsync(output, 8, 8, 1, 1, 0, scenario === 'cube' ? 3 : 0)
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
      // This reset belongs to the outer pass that deliberately presents to canvas.
      renderer.setRenderTarget(null)
    },
    { phase: 'render', priority: 1000 }
  )

  return null
}

createRoot(document.getElementById('root')!).render(
  <Canvas camera={{ position: [0, 2, 5] }} dpr={1} frameloop="always">
    <Probe />
    {scenario === 'nested' ? <Nested /> : <Candidate />}
    <mesh
      onBeforeRender={() => {
        if (scenario === 'error' && !result.injected) {
          result.injected = true
          throw new Error(expectedCaptureError)
        }
      }}
    >
      <boxGeometry />
      <meshBasicMaterial color="blue" />
    </mesh>
  </Canvas>
)
