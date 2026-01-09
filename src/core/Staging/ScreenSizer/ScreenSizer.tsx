import { ThreeElements, useFrame } from '@react-three/fiber'
import * as React from 'react'
import { forwardRef, useRef } from 'react'
import { Object3D, Vector3 } from '#three'
import { calculateScaleFactor } from '../../../utils/calculateScaleFactor'
import { ForwardRefComponent } from '../../../utils/ts-utils'

const worldPos = /* @__PURE__ */ new Vector3()

export type ScreenSizerProps = Omit<ThreeElements['object3D'], 'ref'> & {
  /** Scale factor. Defaults to 1, which equals 1 pixel size. */
  scale?: number
}

/**
 * Adds an `<object3D />` that scales objects to screen space.
 *
 * @example Basic usage
 * ```jsx
 * <ScreenSizer scale={1}>
 *   <Box args={[100, 100, 100]} /> // will render roughly as a 100px box
 * </ScreenSizer>
 * ```
 */
export const ScreenSizer: ForwardRefComponent<ScreenSizerProps, Object3D> = /* @__PURE__ */ forwardRef<
  Object3D,
  ScreenSizerProps
>(({ scale = 1, ...props }, ref) => {
  const container = useRef<Object3D>(null!)
  React.useImperativeHandle(ref, () => container.current, [])

  useFrame((state) => {
    const obj = container.current
    if (!obj) return
    const sf = calculateScaleFactor(obj.getWorldPosition(worldPos), scale, state.camera, state.size)
    obj.scale.setScalar(sf * scale)
  })

  return <object3D ref={container} {...props} />
})
