import { Object3D, Camera, CubeCamera, Scene } from '#three'
import { CubeRenderTarget } from '#drei-platform'
import * as React from 'react'
import { useThree } from '@react-three/fiber'
import { suspend, clear } from 'suspend-react'

export type PreloadProps = {
  all?: boolean
  scene?: Object3D
  camera?: Camera
}

/**
 * Pre-compiles shaders to avoid jank on first render.
 * Place at the end of your scene.
 *
 * On WebGL, `renderer.compile()` is synchronous and everything is compiled before the
 * browser gets to paint. On WebGPU, `renderer.compile` is an alias for `compileAsync()`
 * and pipelines are built off the main thread; the renderer skips objects whose pipeline is
 * still compiling, so they would otherwise pop in one by one. To keep the "compiled before
 * first paint" guarantee, `Preload` suspends until `compileAsync()` resolves. Wrap it (and
 * the scene it preloads) in a `<Suspense>` boundary as you would any other loader.
 *
 * @example Basic usage
 * ```jsx
 * <Canvas>
 *   <Suspense fallback={null}>
 *     <Scene />
 *     <Preload all />
 *   </Suspense>
 * </Canvas>
 * ```
 */
export function Preload({ all, scene, camera }: PreloadProps) {
  const renderer = useThree(({ renderer }) => renderer)
  const dCamera = useThree(({ camera }) => camera)
  const dScene = useThree(({ scene }) => scene)

  // Set when compile() hands back a promise (WebGPU). Suspending on it hides the scene
  // until every pipeline is ready, instead of letting objects appear as they finish.
  const [pending, setPending] = React.useState<Promise<void> | null>(null)
  if (pending) suspend(pending, [pending])

  // Layout effect because it must run before React commits
  React.useLayoutEffect(() => {
    const invisible: Object3D[] = []
    if (all) {
      // Find all invisible objects, store and then flip them
      ;(scene || dScene).traverse((object) => {
        if (object.visible === false) {
          invisible.push(object)
          object.visible = true
        }
      })
    }
    // Now compile the scene. WebGLRenderer.compile() is synchronous; the WebGPU Renderer's
    // `compile` getter returns compileAsync, whose scene traversal still runs synchronously
    // (r3f awaits renderer.init() before mounting) but whose pipelines finish later.
    const result = renderer.compile(scene || dScene, camera || dCamera)
    // And for good measure, hit it with a cube camera
    const cubeRenderTarget = new CubeRenderTarget(128)
    const cubeCamera = new CubeCamera(0.01, 100000, cubeRenderTarget)
    cubeCamera.update(renderer, (scene || dScene) as Scene)
    cubeRenderTarget.dispose()
    // Flips these objects back
    invisible.forEach((object) => (object.visible = false))

    if (!(result instanceof Promise)) return
    const promise: Promise<void> = result
    setPending(promise)
    return () => clear([promise])
  }, [])
  return null
}
