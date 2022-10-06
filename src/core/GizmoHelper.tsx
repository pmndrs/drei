import * as React from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import {
  Camera,
  Color,
  Group,
  Intersection,
  Matrix4,
  Object3D,
  Quaternion,
  Raycaster,
  Scene,
  Texture,
  Vector3,
} from 'three'
import { OrthographicCamera } from './OrthographicCamera'
import { useCamera } from './useCamera'
import { OrbitControls as OrbitControlsType } from 'three-stdlib'

type GizmoHelperContext = {
  tweenCamera: (direction: Vector3) => void
  raycast: (raycaster: Raycaster, intersects: Intersection[]) => void
}

const Context = React.createContext<GizmoHelperContext>({} as GizmoHelperContext)

export const useGizmoContext = () => {
  return React.useContext<GizmoHelperContext>(Context)
}

const turnRate = 2 * Math.PI // turn rate in angles per second
const dummy = new Object3D()
const matrix = new Matrix4()
const [q1, q2] = [new Quaternion(), new Quaternion()]
const target = new Vector3()
const targetPosition = new Vector3()

type ControlsProto = { update(): void; target: THREE.Vector3 }

export type GizmoHelperProps = JSX.IntrinsicElements['group'] & {
  alignment?:
    | 'top-left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'center-right'
    | 'center-left'
    | 'center-center'
    | 'top-center'
  margin?: [number, number]
  renderPriority?: number
  autoClear?: boolean
  onUpdate?: () => void // update controls during animation
  // TODO: in a new major state.controls should be the only means of consuming controls, the
  // onTarget prop can then be removed!
  onTarget?: () => Vector3 // return the target to rotate around
}

const isOrbitControls = (controls: ControlsProto): controls is OrbitControlsType => {
  return 'minPolarAngle' in (controls as OrbitControlsType)
}

export const GizmoHelper = ({
  alignment = 'bottom-right',
  margin = [80, 80],
  renderPriority = 0,
  autoClear = true,
  onUpdate,
  onTarget,
  children: GizmoHelperComponent,
}: GizmoHelperProps): any => {
  const size = useThree(({ size }) => size)
  const mainCamera = useThree(({ camera }) => camera)
  // @ts-expect-error new in @react-three/fiber@7.0.5
  const defaultControls = useThree(({ controls }) => controls) as ControlsProto
  const gl = useThree(({ gl }) => gl)
  const scene = useThree(({ scene }) => scene)
  const invalidate = useThree(({ invalidate }) => invalidate)

  const backgroundRef = React.useRef<null | Color | Texture>()
  const gizmoRef = React.useRef<Group>()
  const virtualCam = React.useRef<Camera>(null!)
  const [virtualScene] = React.useState(() => new Scene())

  const animating = React.useRef(false)
  const radius = React.useRef(0)
  const focusPoint = React.useRef(new Vector3(0, 0, 0))
  const defaultUp = React.useRef(new Vector3(0, 0, 0))

  React.useEffect(() => {
    defaultUp.current.copy(mainCamera.up)
  }, [mainCamera])

  const tweenCamera = React.useCallback(
    (direction: Vector3) => {
      animating.current = true
      if (defaultControls || onTarget) focusPoint.current = defaultControls?.target || onTarget?.()
      radius.current = mainCamera.position.distanceTo(target)

      // Rotate from current camera orientation
      q1.copy(mainCamera.quaternion)

      // To new current camera orientation
      targetPosition.copy(direction).multiplyScalar(radius.current).add(target)
      dummy.lookAt(targetPosition)
      q2.copy(dummy.quaternion)

      invalidate()
    },
    [defaultControls, mainCamera, onTarget, invalidate]
  )

  React.useEffect(() => {
    if (scene.background) {
      //Interchange the actual scene background with the virtual scene
      backgroundRef.current = scene.background
      scene.background = null
      virtualScene.background = backgroundRef.current
    }

    return () => {
      // reset on unmount
      if (backgroundRef.current) scene.background = backgroundRef.current
    }
  }, [])

  useFrame((_, delta) => {
    if (virtualCam.current && gizmoRef.current) {
      // Animate step
      if (animating.current) {
        if (q1.angleTo(q2) < 0.01) {
          animating.current = false

          // Orbit controls uses UP vector as the orbit axes,
          // so we need to reset it after the animation is done
          // moving it around for the controls to work correctly
          if (isOrbitControls(defaultControls)) {
            mainCamera.up.copy(defaultUp.current)
          }
        } else {
          const step = delta * turnRate
          // animate position by doing a slerp and then scaling the position on the unit sphere
          q1.rotateTowards(q2, step)
          // animate orientation
          mainCamera.position.set(0, 0, 1).applyQuaternion(q1).multiplyScalar(radius.current).add(focusPoint.current)
          mainCamera.up.set(0, 1, 0).applyQuaternion(q1).normalize()
          mainCamera.quaternion.copy(q1)
          if (onUpdate) onUpdate()
          else if (defaultControls) defaultControls.update()
          invalidate()
        }
      }

      // Sync Gizmo with main camera orientation
      matrix.copy(mainCamera.matrix).invert()
      gizmoRef.current?.quaternion.setFromRotationMatrix(matrix)

      // Render virtual camera
      if (autoClear) gl.autoClear = false
      gl.clearDepth()
      gl.render(virtualScene, virtualCam.current)
    }
  }, renderPriority)

  const raycast = useCamera(virtualCam)
  const gizmoHelperContext = React.useMemo(() => ({ tweenCamera, raycast }), [tweenCamera])

  // Position gizmo component within scene
  const [marginX, marginY] = margin

  const x = alignment.endsWith('-center')
    ? 0
    : alignment.endsWith('-left')
    ? -size.width / 2 + marginX
    : size.width / 2 - marginX
  const y = alignment.startsWith('center-')
    ? 0
    : alignment.startsWith('top-')
    ? size.height / 2 - marginY
    : -size.height / 2 + marginY
  return createPortal(
    <Context.Provider value={gizmoHelperContext}>
      <OrthographicCamera ref={virtualCam} position={[0, 0, 200]} />
      <group ref={gizmoRef} position={[x, y, 0]}>
        {GizmoHelperComponent}
      </group>
    </Context.Provider>,
    virtualScene
  )
}
