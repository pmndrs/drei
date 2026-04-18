import { type Camera, type Object3D } from '#three'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'

export type PreloadProps = {
  all?: boolean
  scene?: Object3D
  camera?: Camera
  onDone?: () => void
}

/**
 * Pre-compiles shaders to avoid jank on first render.
 * Place at the end of your scene.
 *
 * @example
 * ```jsx
 * const [ready, setReady] = useState(false)
 *
 * <Canvas style={{ opacity: ready ? 1 : 0 }}>
 *   <Scene />
 *   <Preload all onDone={() => setReady(true)} />
 * </Canvas>
 * ```
 */

export function Preload({ all, scene, camera, onDone }: PreloadProps) {
  const renderer = useThree((state) => state.renderer)
  const defaultCamera = useThree((state) => state.camera)
  const defaultScene = useThree((state) => state.scene)

  // Ref to store the original visibility and frustumCulled state of objects to restore later
  const snapshotRef = useRef(new Map<Object3D, { visible: boolean; frustumCulled: boolean }>())

  // Layout effect because it must run before React commits
  useLayoutEffect(() => {
    // Guard against double invocation in React StrictMode
    if (snapshotRef.current.size > 0) return

    const onPreload = async () => {
      const targetScene = scene ?? defaultScene
      const targetCamera = camera ?? defaultCamera

      if (all) {
        // Find all invisible objects, store and then flip them
        targetScene.traverse((object) => {
          snapshotRef.current.set(object, {
            visible: object.visible,
            frustumCulled: object.frustumCulled,
          })

          object.visible = true
          object.frustumCulled = false
        })
      }

      // Now compile the scene
      await renderer.compileAsync(targetScene, targetCamera)

      // Flips these objects back
      snapshotRef.current.forEach((state, object) => {
        object.visible = state.visible
        object.frustumCulled = state.frustumCulled
      })

      // Fire the onDone callback if provided
      onDone?.()
    }

    onPreload()
  }, [])

  return null
}
