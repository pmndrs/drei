import * as React from 'react'
import { createPortal, useFrame, useThree } from 'react-three-fiber'
import { BoxGeometry, CanvasTexture, Event, Group, Matrix4, Object3D, Quaternion, Scene, Vector3 } from 'three'
import { OrthographicCamera } from './OrthographicCamera'
import { useCamera } from './useCamera'

function Disc({
  arcStyle,
  label,
  labelColor,
  ...props
}: JSX.IntrinsicElements['sprite'] & { arcStyle: string; label?: string; labelColor: string }) {
  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')!
    context.beginPath()
    context.arc(32, 32, 16, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = arcStyle
    context.fill()

    if (label) {
      context.font = '24px Arial'
      context.textAlign = 'center'
      context.fillStyle = labelColor
      context.fillText(label, 32, 41)
    }
    return new CanvasTexture(canvas)
  }, [arcStyle, label, labelColor])

  const [active, setActive] = React.useState(false)
  const scale = (label ? 1 : 0.75) * (active ? 1.2 : 1)
  const pointerOver = (e: Event) => void (setActive(true), e.stopPropagation())
  const pointerOut = (e: Event) => void (setActive(false), e.stopPropagation())
  return (
    <sprite scale={[scale, scale, scale]} onPointerOver={pointerOver} onPointerOut={pointerOut} {...props}>
      <spriteMaterial map={texture} toneMapped={false} />
    </sprite>
  )
}

function Axis({ color, rotation }: JSX.IntrinsicElements['mesh'] & { color: string }) {
  const geometry = React.useMemo(() => new BoxGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0), [])
  return (
    <mesh geometry={geometry} rotation={rotation}>
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}

export type NavigationGizmoProps = JSX.IntrinsicElements['group'] & {
  alignment?: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'
  axisColors?: [string, string, string]
  labelColor?: string
  margin?: [number, number]
  onUpdate: () => void // update controls during animation
  onTarget: () => Vector3 // return the target to rotate around
}

export const NavigationGizmo = ({
  axisColors = ['#ff3653', '#8adb00', '#2c8fff'],
  labelColor = '#000',
  alignment = 'bottom-right',
  margin = [80, 80],
  onUpdate,
  onTarget,
}: NavigationGizmoProps): any => {
  const { gl, scene, camera: mainCamera, size } = useThree()
  const turnRate = 2 * Math.PI // turn rate in angles per second

  const virtualCam = React.useRef<any>()
  const helperRef = React.useRef<Group>()

  const [animating, setAnimating] = React.useState(false)
  const [radius, setRadius] = React.useState(0)

  const dummy = React.useMemo(() => new Object3D(), [])
  const matrix = React.useMemo(() => new Matrix4(), [])
  const [q1, q2] = React.useMemo(() => [new Quaternion(), new Quaternion()], [])
  const target = React.useMemo(() => new Vector3(), [])
  const targetPosition = React.useMemo(() => new Vector3(), [])
  const targetQuaternion = React.useMemo(() => new Quaternion(), [])
  const virtualScene = React.useMemo(() => new Scene(), [])

  useFrame((_, delta) => {
    if (virtualCam.current && helperRef.current) {
      if (animating) {
        const step = delta * turnRate
        const focusPoint = onTarget() || new Vector3(0, 0, 0)

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

      matrix.copy(mainCamera.matrix).invert()
      helperRef.current.quaternion.setFromRotationMatrix(matrix)

      // render main scene
      gl.autoClear = true
      gl.render(scene, mainCamera)

      // render view helper
      gl.autoClear = false
      gl.clearDepth()
      gl.render(virtualScene, virtualCam.current)
    }
  }, 1)

  const discProps = {
    labelColor,
    raycast: useCamera(virtualCam),
    onPointerDown: (e: Event) => {
      if (target) {
        const radius = mainCamera.position.distanceTo(target)
        setRadius(radius)
        targetPosition.copy(e.object.position).multiplyScalar(radius).add(target)
        dummy.position.copy(target)

        dummy.lookAt(mainCamera.position)
        q1.copy(dummy.quaternion)

        dummy.lookAt(targetPosition)
        q2.copy(dummy.quaternion)

        setAnimating(true)
      }
      e.stopPropagation()
    },
  }

  const [marginX, marginY] = margin
  const x = alignment.endsWith('-left') ? -size.width / 2 + marginX : size.width / 2 - marginX
  const y = alignment.startsWith('top-') ? size.height / 2 - marginY : -size.height / 2 + marginY
  const [colorX, colorY, colorZ] = axisColors
  return createPortal(
    <>
      <OrthographicCamera ref={virtualCam} makeDefault={false} position={[0, 0, 100]} />
      <group ref={helperRef} scale={[40, 40, 40]} position={[x, y, 0]}>
        <Axis color={colorX} rotation={[0, 0, 0]} />
        <Axis color={colorY} rotation={[0, 0, Math.PI / 2]} />
        <Axis color={colorZ} rotation={[0, -Math.PI / 2, 0]} />
        <Disc arcStyle={colorX} position={[1, 0, 0]} label="X" {...discProps} />
        <Disc arcStyle={colorY} position={[0, 1, 0]} label="Y" {...discProps} />
        <Disc arcStyle={colorZ} position={[0, 0, 1]} label="Z" {...discProps} />
        <Disc arcStyle={colorX} position={[-1, 0, 0]} {...discProps} />
        <Disc arcStyle={colorY} position={[0, -1, 0]} {...discProps} />
        <Disc arcStyle={colorZ} position={[0, 0, -1]} {...discProps} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
      </group>
    </>,
    virtualScene
  )
}
