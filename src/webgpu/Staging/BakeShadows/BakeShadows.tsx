import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Light, LightShadow, Object3D } from 'three/webgpu'

type PriorShadowUpdate = { autoUpdate: boolean; needsUpdate: boolean }

function isShadowCastingLight(object: Object3D): object is Object3D & Light & { shadow: LightShadow } {
  const light = object as Object3D & Partial<Light> & { shadow?: LightShadow }
  return light.isLight === true && light.castShadow === true && light.shadow != null
}

/**
 * Freezes shadow maps so they stop re-rendering every frame.
 *
 * The WebGL version of this component flips `renderer.shadowMap.autoUpdate` /
 * `.needsUpdate`. That does nothing here: `WebGPURenderer.shadowMap` is a plain
 * config object (`{ enabled, transmitted, type }`, see
 * `three/src/renderers/common/Renderer.js`) with no update flags at all, so the
 * WebGL implementation is a silent no-op on WebGPU — see #2665.
 *
 * WebGPU moved shadow-update control onto the light. `ShadowNode.updateBefore()`
 * reads `shadow.needsUpdate || shadow.autoUpdate` and, once it has successfully
 * drawn the map, clears `shadow.needsUpdate` itself. So setting
 * `autoUpdate = false, needsUpdate = true` buys exactly one more shadow render —
 * we do not need to count frames, and if the first attempt does not settle
 * (the depth texture version moved) three keeps `needsUpdate` set and retries.
 *
 * Lights that mount later — a suspended GLTF, a conditional light — are picked
 * up because the scan runs per frame rather than once on mount. Each shadow is
 * only touched the first time it is seen, so a frozen light is never re-armed.
 * The recurring cost is one `scene.traverse` plus a `WeakMap.has` per frame,
 * which is orders of magnitude below the shadow-map render this avoids.
 */
export function BakeShadows() {
  const scene = useThree((state) => state.scene)

  // Prior flags per shadow, so unmount restores what was actually there instead
  // of blindly writing `true` the way the WebGL version does. WeakMap, so a
  // light that unmounts while we are mounted is not retained by us.
  const priorRef = React.useRef<WeakMap<LightShadow, PriorShadowUpdate>>(new WeakMap())

  useFrame(() => {
    const prior = priorRef.current
    scene.traverse((object) => {
      if (!isShadowCastingLight(object)) return
      const shadow = object.shadow
      // Already baked. Re-arming `needsUpdate` here would redraw every frame,
      // which is the exact thing this component exists to prevent.
      if (prior.has(shadow)) return
      prior.set(shadow, { autoUpdate: shadow.autoUpdate, needsUpdate: shadow.needsUpdate })
      shadow.autoUpdate = false
      shadow.needsUpdate = true
    })
  })

  React.useEffect(() => {
    const prior = priorRef.current
    return () => {
      scene.traverse((object) => {
        if (!isShadowCastingLight(object)) return
        const previous = prior.get(object.shadow)
        if (previous === undefined) return
        object.shadow.autoUpdate = previous.autoUpdate
        object.shadow.needsUpdate = previous.needsUpdate
        prior.delete(object.shadow)
      })
    }
  }, [scene])

  return null
}
