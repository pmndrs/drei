import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '#test-fiber'
import { useThree } from '@react-three/fiber/extension'
import * as THREE from '#three'
import { RenderTarget, CubeRenderTarget } from '#drei-platform'
import { MeshPortalMaterial } from '#test-portal'
import { createPostProcessing } from '#test-post-processing'

const params = new URLSearchParams(location.search)
const target = params.get('target') || 'bound'
const throwPass = Number(params.get('throwPass') || 0)
const marker = 'portal-sdf-test-injected-error'
const result: any = { target, throwPass, captures: 0, errors: [] }
;(window as any).result = result
let outer: any
let continuation: THREE.Scene
let camera: THREE.Camera
let post: ReturnType<typeof createPostProcessing> | null

// A caller can keep a target bound while a React commit initializes portal blur.
// Sibling layout effects bracket the actual MeshPortalMaterial SDF effect.
function BeforeCapture() {
  const { renderer } = useThree()
  const r: any = renderer
  React.useLayoutEffect(() => {
    result.backend = r.backend?.isWebGPUBackend ? 'WebGPU' : r.isWebGLRenderer ? 'WebGL' : 'fallback'
    r.backend?.device?.addEventListener('uncapturederror', (event: any) => result.errors.push(event.error.message))
    outer =
      target === 'cube'
        ? new CubeRenderTarget(16, { type: THREE.UnsignedByteType })
        : new RenderTarget(16, 16, { type: THREE.UnsignedByteType, generateMipmaps: target === 'mip' })
    continuation = new THREE.Scene()
    continuation.background = new THREE.Color('red')
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    post = target === 'bound' ? createPostProcessing(r, outer) : null
    r.setRenderTarget(outer, target === 'cube' ? 3 : 0)
    r.render(continuation, camera)
    r.setRenderTarget(target === 'default' ? null : outer, target === 'cube' ? 3 : 0, target === 'mip' ? 1 : 0)
    r.setClearColor('red', 0.25)
    const original = r.render
    r.render = function (...args: any[]) {
      result.captures++
      if (throwPass && result.captures === throwPass) {
        result.thrown = true
        throw new Error(marker)
      }
      return original.apply(this, args)
    }
    return () => {
      r.render = original
      outer.dispose()
      post?.dispose()
    }
  }, [r])
  return null
}

function AfterCapture() {
  const { renderer } = useThree()
  const r: any = renderer
  React.useLayoutEffect(() => {
    result.capturesAtCleanup = result.captures
    result.state = {
      target: r.getRenderTarget() === (target === 'default' ? null : outer),
      face: r.getActiveCubeFace() === (target === 'cube' ? 3 : 0),
      mip: r.getActiveMipmapLevel() === (target === 'mip' ? 1 : 0),
      clearColor: r.getClearColor(new THREE.Color()).getHexString() === 'ff0000',
      clearAlpha: r.getClearAlpha() === 0.25,
    }
    if (throwPass || !post) {
      r.setRenderTarget(null)
      result.done = true
      return
    }
    // Continue without rebinding, then inspect that target through post-processing.
    continuation.background!.set('lime')
    r.render(continuation, camera)
    post.render()
    const output = post.output()
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
    r.setRenderTarget(null)
  }, [r])
  return null
}

createRoot(document.getElementById('root')!).render(
  <Canvas camera={{ position: [0, 0, 5] }} dpr={1} frameloop="never">
    <BeforeCapture />
    <mesh>
      <planeGeometry />
      <MeshPortalMaterial resolution={16} blur={0.2}>
        <mesh>
          <boxGeometry />
          <meshBasicMaterial />
        </mesh>
      </MeshPortalMaterial>
    </mesh>
    <AfterCapture />
  </Canvas>
)
