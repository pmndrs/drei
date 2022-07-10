import { ReactThreeFiber, useThree } from '@react-three/fiber'
import omit from 'lodash.omit'
import pick from 'lodash.pick'
import * as React from 'react'
import * as THREE from 'three'
import { TransformControls as TransformControlsImpl } from 'three-stdlib'
import { Manipulator3D as BaseManipulator3D, ManipulatorMesh } from 'manipulator3d'

type ControlsProto = {
  enabled: boolean
}

const modes = ['translate', 'rotate', 'scale'] as const
type Modes = typeof modes[number]
type MultipleModes = [Modes, Modes?, Modes?]
export type TransformControlMode = string | MultipleModes

export type TransformControlsProps = ReactThreeFiber.Object3DNode<TransformControlsImpl, typeof TransformControlsImpl> &
  JSX.IntrinsicElements['group'] & {
    object?: THREE.Object3D | React.MutableRefObject<THREE.Object3D>
    enabled?: boolean
    axis?: string | null
    domElement?: HTMLElement
    mode?: TransformControlMode
    translationSnap?: number | null
    rotationSnap?: number | null
    scaleSnap?: number | null
    space?: string
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
  }

export const TransformControls = React.forwardRef<TransformControlsImpl, TransformControlsProps>((props, ref) => {
  const { mode } = props
  if (Array.isArray(mode)) {
    return <MultiTransformControls ref={ref as any} {...props} />
  }
  return <SingleTransformControls ref={ref as any} {...props} />
})

const SingleTransformControls = React.forwardRef<TransformControlsImpl, TransformControlsProps>(
  ({ children, domElement, onChange, onMouseDown, onMouseUp, onObjectChange, object, ...props }, ref) => {
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
        <primitive ref={ref} object={controls} {...transformProps} />
        <group ref={group} {...objectProps}>
          {children}
        </group>
      </>
    ) : null
  }
)

const MultiTransformControls = React.forwardRef<TransformControlsImpl, TransformControlsProps>(
  ({ children, domElement, onChange, onMouseDown, onMouseUp, onObjectChange, object, ...props }, ref) => {
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
    const { enabled = true } = props
    const transformProps = pick(rest, transformOnlyPropNames)
    const objectProps = omit(rest, transformOnlyPropNames)
    const gl = useThree((state) => state.gl)
    const scene = useThree((state) => state.scene)
    const events = useThree((state) => state.events)
    const defaultCamera = useThree((state) => state.camera)
    const explCamera = camera || defaultCamera
    const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
    const controls = React.useMemo(
      () =>
        new Manipulator3D({
          scene,
          camera: explCamera,
          domElement: explDomElement,
        }),
      [scene, explCamera, explDomElement]
    )

    const group = React.useRef<THREE.Group>()

    React.useLayoutEffect(() => {
      controls.setActive(enabled)
    }, [controls, enabled])

    React.useLayoutEffect(() => {
      const active = controls.isActive()
      controls.setActive(true) // Must be active to attach
      if (object) {
        controls.attach(object instanceof THREE.Object3D ? object : object.current)
      } else if (group.current instanceof THREE.Object3D) {
        controls.attach(group.current)
      }
      controls.setActive(active)
      return () => void controls.detach()
    }, [object, children, controls])

    const activeModes = getActiveModes(transformProps.mode)
    React.useEffect(() => {
      controls.useRotate(activeModes.rotate).useScale(activeModes.scale).useTranslate(activeModes.translate)
    }, [controls, activeModes.rotate, activeModes.scale, activeModes.translate])

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

function getActiveModes(activeMode: TransformControlMode): Record<Modes, boolean> {
  return Object.fromEntries<boolean>(
    modes.map((mode) => {
      const active = activeMode === mode || activeMode.includes(mode)
      return [mode, active]
    })
  ) as Record<Modes, boolean>
}

class Manipulator3D extends ManipulatorMesh {
  private manipulator

  constructor({ scene, camera, domElement }) {
    const manipulator = new BaseManipulator3D(
      scene,
      camera,
      {
        domElement,
      },
      true
    )
    super(manipulator.data)
    manipulator.mesh = this
    this.manipulator = manipulator
  }

  addEventListener(eventName, callback) {
    this.on(eventName, callback)
  }
  on(eventName, callback) {
    this.manipulator.on(eventName, callback)
  }

  removeEventListener(eventName, callback) {
    this.off(eventName, callback)
  }
  off(eventName, callback) {
    this.manipulator.off(eventName, callback)
  }

  setActive(active) {
    this.manipulator.setActive(active)
  }
  isActive() {
    return this.manipulator.isActive()
  }

  attach(object) {
    this.manipulator.attach(object)
  }
  detach() {
    this.manipulator.detach()
  }

  useTranslate(active) {
    this.manipulator.useTranslate(active)
    return this
  }
  useRotate(active) {
    this.manipulator.useRotate(active)
    return this
  }
  useScale(active) {
    this.manipulator.useScale(active)
    return this
  }
}
