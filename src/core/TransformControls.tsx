import { ReactThreeFiber, useThree } from '@react-three/fiber'
import omit from 'lodash.omit'
import pick from 'lodash.pick'
import * as React from 'react'
import * as THREE from 'three'
import { TransformControls as TransformControlsImpl } from 'three-stdlib'

export type TransformControlsProps = ReactThreeFiber.Object3DNode<TransformControlsImpl, typeof TransformControlsImpl> &
  JSX.IntrinsicElements['group'] & {
    enabled?: boolean
    axis?: string | null
    mode?: string
    translationSnap?: number | null
    rotationSnap?: number | null
    scaleSnap?: number | null
    space?: string
    size?: number
    showX?: boolean
    showY?: boolean
    showZ?: boolean
    children: React.ReactElement<THREE.Object3D>
    camera?: THREE.Camera
    onChange?: (e?: THREE.Event) => void
    onMouseDown?: (e?: THREE.Event) => void
    onMouseUp?: (e?: THREE.Event) => void
    onObjectChange?: (e?: THREE.Event) => void
  }

export const TransformControls = React.forwardRef<TransformControlsImpl, TransformControlsProps>(
  ({ children, onChange, onMouseDown, onMouseUp, onObjectChange, ...props }, ref) => {
    const transformOnlyPropNames = [
      'enabled',
      'axis',
      'mode',
      'translationSnap',
      'rotationSnap',
      'scaleSnap',
      'space',
      'size',
      'showX',
      'showY',
      'showZ',
    ]

    const { camera, ...rest } = props
    const transformProps = pick(rest, transformOnlyPropNames)
    const objectProps = omit(rest, transformOnlyPropNames)

    const gl = useThree(({ gl }) => gl)
    const defaultCamera = useThree(({ camera }) => camera)
    const invalidate = useThree(({ invalidate }) => invalidate)

    const explCamera = camera || defaultCamera

    const [controls] = React.useState(() => new TransformControlsImpl(explCamera, gl.domElement))

    const group = React.useRef<THREE.Group>()
    React.useLayoutEffect(() => void controls?.attach(group.current as THREE.Object3D), [children, controls])

    React.useEffect(() => {
      const callback = (e: THREE.Event) => {
        invalidate()
        if (onChange) onChange(e)
      }

      controls?.addEventListener?.('change', callback)
      if (onMouseDown) controls?.addEventListener?.('mouseDown', onMouseDown)
      if (onMouseUp) controls?.addEventListener?.('mouseUp', onMouseUp)
      if (onObjectChange) controls?.addEventListener?.('objectChange', onObjectChange)

      return () => {
        controls?.removeEventListener?.('change', callback)
        if (onMouseDown) controls?.removeEventListener?.('mouseDown', onMouseDown)
        if (onMouseUp) controls?.removeEventListener?.('mouseUp', onMouseUp)
        if (onObjectChange) controls?.removeEventListener?.('objectChange', onObjectChange)
      }
    }, [onChange, onMouseDown, onMouseUp, onObjectChange, controls, invalidate])

    return controls ? (
      <>
        <primitive ref={ref} dispose={undefined} object={controls} {...transformProps} />
        <group ref={group} {...objectProps}>
          {children}
        </group>
      </>
    ) : null
  }
)
