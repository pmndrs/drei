import { ReactThreeFiber, useThree } from '@react-three/fiber'
import omit from 'lodash.omit'
import pick from 'lodash.pick'
import * as React from 'react'
import * as THREE from 'three'
import { TransformControls as TransformControlsImpl } from 'three-stdlib'

type ControlsProto = {
  enabled: boolean
}

export type TransformControlsProps = ReactThreeFiber.Object3DNode<TransformControlsImpl, typeof TransformControlsImpl> &
  JSX.IntrinsicElements['group'] & {
    object?: THREE.Object3D | React.MutableRefObject<THREE.Object3D>
    enabled?: boolean
    axis?: string | null
    domElement?: HTMLElement
    mode?: 'translate' | 'rotate' | 'scale'
    translationSnap?: number | null
    rotationSnap?: number | null
    scaleSnap?: number | null
    space?: 'world' | 'local'
    size?: number
    showX?: boolean
    showY?: boolean
    showZ?: boolean
    children?: React.ReactElement<THREE.Object3D>
    camera?: THREE.Camera
    onChange?: (e?: THREE.Event) => void
    onMouseDown?: (e?: THREE.Event) => void
    onMouseUp?: (e?: THREE.Event) => void
    onObjectChange?: (e?: THREE.Event) => void
    makeDefault?: boolean
  }

export const TransformControls = React.forwardRef<TransformControlsImpl, TransformControlsProps>(
  ({ children, domElement, onChange, onMouseDown, onMouseUp, onObjectChange, object, makeDefault, ...props }, ref) => {
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
    // @ts-expect-error new in @react-three/fiber@7.0.5
    const defaultControls = useThree((state) => state.controls) as ControlsProto
    const gl = useThree((state) => state.gl)
    const events = useThree((state) => state.events)
    const defaultCamera = useThree((state) => state.camera)
    const invalidate = useThree((state) => state.invalidate)
    const get = useThree((state) => state.get)
    const set = useThree((state) => state.set)
    const explCamera = camera || defaultCamera
    const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
    const controls = React.useMemo(
      () => new TransformControlsImpl(explCamera, explDomElement),
      [explCamera, explDomElement]
    )
    const group = React.useRef<THREE.Group>()

    React.useLayoutEffect(() => {
      if (object) {
        controls.attach(object instanceof THREE.Object3D ? object : object.current)
      } else if (group.current instanceof THREE.Object3D) {
        controls.attach(group.current)
      }

      return () => void controls.detach()
    }, [object, children, controls])

    React.useEffect(() => {
      if (defaultControls) {
        const callback = (event) => (defaultControls.enabled = !event.value)
        controls.addEventListener('dragging-changed', callback)
        return () => controls.removeEventListener('dragging-changed', callback)
      }
    }, [controls, defaultControls])

    const onChangeRef = React.useRef<(e?: THREE.Event) => void>()
    const onMouseDownRef = React.useRef<(e?: THREE.Event) => void>()
    const onMouseUpRef = React.useRef<(e?: THREE.Event) => void>()
    const onObjectChangeRef = React.useRef<(e?: THREE.Event) => void>()

    React.useLayoutEffect(() => void (onChangeRef.current = onChange), [onChange])
    React.useLayoutEffect(() => void (onMouseDownRef.current = onMouseDown), [onMouseDown])
    React.useLayoutEffect(() => void (onMouseUpRef.current = onMouseUp), [onMouseUp])
    React.useLayoutEffect(() => void (onObjectChangeRef.current = onObjectChange), [onObjectChange])

    React.useEffect(() => {
      const onChange = (e: THREE.Event) => {
        invalidate()
        onChangeRef.current?.(e)
      }

      const onMouseDown = (e: THREE.Event) => onMouseDownRef.current?.(e)
      const onMouseUp = (e: THREE.Event) => onMouseUpRef.current?.(e)
      const onObjectChange = (e: THREE.Event) => onObjectChangeRef.current?.(e)

      controls.addEventListener('change', onChange)
      controls.addEventListener('mouseDown', onMouseDown)
      controls.addEventListener('mouseUp', onMouseUp)
      controls.addEventListener('objectChange', onObjectChange)

      return () => {
        controls.removeEventListener('change', onChange)
        controls.removeEventListener('mouseDown', onMouseDown)
        controls.removeEventListener('mouseUp', onMouseUp)
        controls.removeEventListener('objectChange', onObjectChange)
      }
    }, [invalidate, controls])

    React.useEffect(() => {
      if (makeDefault) {
        const old = get().controls
        set({ controls })
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    return controls ? (
      <>
        <primitive ref={ref} object={controls} {...transformProps} />
        <group ref={group} {...objectProps}>
          {children}
        </group>
      </>
    ) : null
  }
)
