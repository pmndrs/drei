import * as React from 'react'
import { createPortal, useFrame, useThree } from 'react-three-fiber'
import { Group, Intersection, Matrix4, Object3D, Quaternion, Raycaster, Scene, Vector3 } from 'three'
import { OrthographicCamera } from './OrthographicCamera'
import { useCamera } from './useCamera'

type GizmoHelperContext = {
  tweenCamera: (direction: Vector3) => void
  raycast: (raycaster: Raycaster, intersects: Intersection[]) => void
}

const Context = React.createContext<GizmoHelperContext>({} as GizmoHelperContext)

export const useGizmoHelper = () => {
  return React.useContext<GizmoHelperContext>(Context)
}

const turnRate = 2 * Math.PI // turn rate in angles per second
const dummy = new Object3D()
const matrix = new Matrix4()
const [q1, q2] = [new Quaternion(), new Quaternion()]
const target = new Vector3()
const targetPosition = new Vector3()
const targetQuaternion = new Quaternion()

export type GizmoHelperProps = JSX.IntrinsicElements['group'] & {
  alignment?: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'
  margin?: [number, number]
  onUpdate: () => void // update controls during animation
  onTarget: () => Vector3 // return the target to rotate around
}

export const GizmoHelper = ({
  alignment = 'bottom-right',
  margin = [80, 80],
  onUpdate,
  onTarget,
  children: GizmoHelperComponent,
}: GizmoHelperProps): any => {
  const { gl, scene, camera: mainCamera, size } = useThree()
  const gizmoRef = React.useRef<Group>()
  const virtualCam = React.useRef<any>()
  const virtualScene = React.useMemo(() => new Scene(), [])
  const [animating, setAnimating] = React.useState(false)
  const [radius, setRadius] = React.useState(0)
  const [focusPoint, setFocusPoint] = React.useState(new Vector3(0, 0, 0))

  function tweenCamera(direction: Vector3) {
    const radius = mainCamera.position.distanceTo(target)
    setRadius(radius)
    setFocusPoint(onTarget())
    setAnimating(true)

    // Rotate from current camera orientation
    dummy.position.copy(target)
    dummy.lookAt(mainCamera.position)
    q1.copy(dummy.quaternion)

    // To new current camera orientation
    targetPosition.copy(direction).multiplyScalar(radius).add(target)
    dummy.lookAt(targetPosition)
    q2.copy(dummy.quaternion)
  }

  function animateStep(delta: number): void {
    if (!animating) return

    const step = delta * turnRate

    // animate position by doing a slerp and then scaling the position on the unit sphere
    q1.rotateTowards(q2, step)
    mainCamera.position.set(0, 0, 1).applyQuaternion(q1).multiplyScalar(radius).add(focusPoint)

    // animate orientation
    mainCamera.quaternion.rotateTowards(targetQuaternion, step)
    mainCamera.updateProjectionMatrix()
    onUpdate && onUpdate()

    if (q1.angleTo(q2) === 0) {
      setAnimating(false)
    }
  }

  useFrame((_, delta) => {
    if (virtualCam.current && gizmoRef.current) {
      animateStep(delta)

      // Sync gizmo with main camera orientation
      matrix.copy(mainCamera.matrix).invert()
      gizmoRef.current.quaternion.setFromRotationMatrix(matrix)

      // Render main scene
      gl.autoClear = true
      gl.render(scene, mainCamera)

      // Render gizmo
      gl.autoClear = false
      gl.clearDepth()
      gl.render(virtualScene, virtualCam.current)
    }
  }, 1)

  const gizmoHelperContext = {
    tweenCamera,
    raycast: useCamera(virtualCam),
  } as GizmoHelperContext

  // Position gizmo component within scene
  const [marginX, marginY] = margin
  const x = alignment.endsWith('-left') ? -size.width / 2 + marginX : size.width / 2 - marginX
  const y = alignment.startsWith('top-') ? size.height / 2 - marginY : -size.height / 2 + marginY
  return createPortal(
    <Context.Provider value={gizmoHelperContext}>
      <OrthographicCamera ref={virtualCam} makeDefault={false} position={[0, 0, 100]} />
      <group ref={gizmoRef} position={[x, y, 0]}>
        {GizmoHelperComponent}
      </group>
    </Context.Provider>,
    virtualScene
  )
}
