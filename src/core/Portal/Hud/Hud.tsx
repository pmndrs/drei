import * as THREE from 'three'
import * as React from 'react'
import { useFrame, useThree, createPortal } from '@react-three/fiber'

type RenderHudProps = {
  defaultScene: THREE.Scene
  defaultCamera: THREE.Camera
  renderPriority?: number
}

function RenderHud({ defaultScene, defaultCamera, renderPriority = 1 }: RenderHudProps) {
  const { renderer, scene, camera } = useThree()
  let oldCLear
  useFrame(
    () => {
      oldCLear = renderer.autoClear
      if (renderPriority === 1) {
        // Clear scene and render the default scene
        renderer.autoClear = true
        renderer.render(defaultScene, defaultCamera)
      }
      // Disable cleaning and render the portal with its own camera
      renderer.autoClear = false
      renderer.clearDepth()
      renderer.render(scene, camera)
      // Restore default
      renderer.autoClear = oldCLear
    },
    { after: 'render', priority: renderPriority }
  )
  // Without an element that receives pointer events state.pointer will always be 0/0
  return <group onPointerOver={() => null} />
}

export type HudProps = {
  /** Any React node */
  children: React.ReactNode
  /** Render priority, default: 1 */
  renderPriority?: number
}

/**
 * Renders a heads-up-display (HUD) scene on top of the main scene.
 * Each HUD is isolated via createPortal - can have its own camera, environment, etc.
 * The first HUD (renderPriority=1) clears and renders the default scene first.
 *
 * @example Overlay HUD
 * ```jsx
 * <Hud>
 *   <PerspectiveCamera makeDefault position={[0, 0, 10]} />
 *   <mesh><ringGeometry /></mesh>
 * </Hud>
 * ```
 *
 * @example Multiple HUDs stacked
 * ```jsx
 * <Hud renderPriority={1}><mesh /></Hud>
 * <Hud renderPriority={2}><mesh /></Hud>
 * ```
 */
export function Hud({ children, renderPriority = 1 }: HudProps) {
  const { scene: defaultScene, camera: defaultCamera } = useThree()
  const [hudScene] = React.useState(() => new THREE.Scene())
  return (
    <>
      {createPortal(
        <>
          {children}
          <RenderHud defaultScene={defaultScene} defaultCamera={defaultCamera} renderPriority={renderPriority} />
        </>,
        hudScene,
        { events: { priority: renderPriority + 1 } }
      )}
    </>
  )
}
