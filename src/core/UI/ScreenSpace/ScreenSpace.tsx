import * as React from 'react'
import { Group } from '#three'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export type ScreenSpaceProps = Omit<ThreeElements['group'], 'ref'> & {
  /** Distance from camera, default: -1 */
  depth?: number
}

/**
 * Adds a `<group />` that aligns objects to screen space.
 *
 * @example Basic usage
 * ```jsx
 * <ScreenSpace depth={1}>
 *   <Box>I'm in screen space</Box>
 * </ScreenSpace>
 * ```
 */
export const ScreenSpace: ForwardRefComponent<ScreenSpaceProps, Group> = /* @__PURE__ */ React.forwardRef<
  Group,
  ScreenSpaceProps
>(({ children, depth = -1, ...rest }, ref) => {
  const localRef = React.useRef<Group>(null!)
  React.useImperativeHandle(ref, () => localRef.current, [])

  useFrame(({ camera }) => {
    localRef.current.quaternion.copy(camera.quaternion)
    localRef.current.position.copy(camera.position)
  })
  return (
    <group ref={localRef} {...rest}>
      <group position-z={-depth}>{children}</group>
    </group>
  )
})
