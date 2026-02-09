import * as React from 'react'
import * as THREE from '#three'
import { ThreeEvent, useThree } from '@react-three/fiber'
import { ForwardRefComponent } from '../../../utils/ts-utils'

const initialModelPosition = /* @__PURE__ */ new THREE.Vector3()
const mousePosition3D = /* @__PURE__ */ new THREE.Vector3()
const dragOffset = /* @__PURE__ */ new THREE.Vector3()
const dragPlaneNormal = /* @__PURE__ */ new THREE.Vector3()
const dragPlane = /* @__PURE__ */ new THREE.Plane()
const startPointerPos = /* @__PURE__ */ new THREE.Vector3()

type ControlsProto = {
  enabled: boolean
}

export type DragConfig = {
  /** Minimum distance before drag starts (pixels for screen, units for 3D), default 0 */
  threshold?: number
  /** Ignore short taps that don't exceed threshold, default true */
  filterTaps?: boolean
}

export type DragControlsProps = {
  /** If autoTransform is true, automatically apply the local transform on drag, true */
  autoTransform?: boolean
  /** The matrix to control */
  matrix?: THREE.Matrix4
  /** Lock the drag to a specific axis */
  axisLock?: 'x' | 'y' | 'z'
  /** Limits */
  dragLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  /** Hover event */
  onHover?: (hovering: boolean) => void
  /** Drag start event */
  onDragStart?: (origin: THREE.Vector3) => void
  /** Drag event */
  onDrag?: (
    localMatrix: THREE.Matrix4,
    deltaLocalMatrix: THREE.Matrix4,
    worldMatrix: THREE.Matrix4,
    deltaWorldMatrix: THREE.Matrix4
  ) => void /** Drag end event */
  onDragEnd?: () => void
  children: React.ReactNode
  /** Drag configuration */
  dragConfig?: DragConfig
}

/**
 * Makes objects draggable in your scene.
 * Supports locking to specific axes, drag limits, and custom events.
 * Works correctly inside portals (RenderTexture, View, etc.) by using R3F's event system.
 *
 * @example Basic usage
 * ```jsx
 * <DragControls>
 *   <mesh />
 * </DragControls>
 * ```
 *
 * @example Controlled with matrix
 * ```jsx
 * const matrix = new THREE.Matrix4()
 * <DragControls
 *   matrix={matrix}
 *   autoTransform={false}
 *   onDrag={(localMatrix) => matrix.copy(localMatrix)}
 * />
 * ```
 */
export const DragControls: ForwardRefComponent<DragControlsProps, THREE.Group> = React.forwardRef<
  THREE.Group,
  DragControlsProps
>(
  (
    {
      autoTransform = true,
      matrix,
      axisLock,
      dragLimits,
      onHover,
      onDragStart,
      onDrag,
      onDragEnd,
      children,
      dragConfig,
      ...props
    },
    fRef
  ) => {
    const defaultControls = useThree((state) => (state as any).controls) as ControlsProto | undefined
    const { camera, invalidate } = useThree()
    const ref = React.useRef<THREE.Group>(null!)

    // Drag state stored in refs to avoid re-renders during drag
    const dragState = React.useRef({
      active: false,
      intentional: false, // Has moved past threshold
      pointerId: -1,
    })

    const threshold = dragConfig?.threshold ?? 0
    const filterTaps = dragConfig?.filterTaps ?? true

    const handlePointerDown = React.useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        ;(event.target as HTMLElement).setPointerCapture(event.pointerId)

        dragState.current.active = true
        dragState.current.intentional = threshold === 0 // If no threshold, immediately intentional
        dragState.current.pointerId = event.pointerId

        if (defaultControls) defaultControls.enabled = false

        // Get initial model position from matrix
        ref.current.matrix.decompose(initialModelPosition, new THREE.Quaternion(), new THREE.Vector3())

        // Store initial pointer intersection point
        mousePosition3D.copy(event.point)
        startPointerPos.copy(event.point)
        dragOffset.copy(mousePosition3D).sub(initialModelPosition)

        // Set up drag plane
        if (!axisLock) {
          camera.getWorldDirection(dragPlaneNormal).negate()
        } else {
          switch (axisLock) {
            case 'x':
              dragPlaneNormal.set(1, 0, 0)
              break
            case 'y':
              dragPlaneNormal.set(0, 1, 0)
              break
            case 'z':
              dragPlaneNormal.set(0, 0, 1)
              break
          }
        }
        dragPlane.setFromNormalAndCoplanarPoint(dragPlaneNormal, mousePosition3D)

        if (dragState.current.intentional) {
          onDragStart && onDragStart(initialModelPosition)
        }

        invalidate()
      },
      [defaultControls, camera, axisLock, threshold, onDragStart, invalidate]
    )

    const handlePointerMove = React.useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!dragState.current.active || event.pointerId !== dragState.current.pointerId) return

        // Use the event's ray (already transformed for portals) to intersect our drag plane
        const intersection = event.ray.intersectPlane(dragPlane, mousePosition3D)
        if (!intersection) return

        // Check threshold if not yet intentional
        if (!dragState.current.intentional) {
          const distance = mousePosition3D.distanceTo(startPointerPos)
          if (distance < threshold) return

          // Passed threshold - now it's an intentional drag
          dragState.current.intentional = true
          onDragStart && onDragStart(initialModelPosition)
        }

        const previousLocalMatrix = ref.current.matrix.clone()
        const previousWorldMatrix = ref.current.matrixWorld.clone()

        const intendedNewPosition = new THREE.Vector3(
          mousePosition3D.x - dragOffset.x,
          mousePosition3D.y - dragOffset.y,
          mousePosition3D.z - dragOffset.z
        )

        // Apply drag limits
        if (dragLimits) {
          intendedNewPosition.x = dragLimits[0]
            ? Math.max(Math.min(intendedNewPosition.x, dragLimits[0][1]), dragLimits[0][0])
            : intendedNewPosition.x
          intendedNewPosition.y = dragLimits[1]
            ? Math.max(Math.min(intendedNewPosition.y, dragLimits[1][1]), dragLimits[1][0])
            : intendedNewPosition.y
          intendedNewPosition.z = dragLimits[2]
            ? Math.max(Math.min(intendedNewPosition.z, dragLimits[2][1]), dragLimits[2][0])
            : intendedNewPosition.z
        }

        if (autoTransform) {
          ref.current.matrix.setPosition(intendedNewPosition)

          const deltaLocalMatrix = ref.current.matrix.clone().multiply(previousLocalMatrix.invert())
          const deltaWorldMatrix = ref.current.matrix.clone().multiply(previousWorldMatrix.invert())

          onDrag && onDrag(ref.current.matrix, deltaLocalMatrix, ref.current.matrixWorld, deltaWorldMatrix)
        } else {
          const tempMatrix = new THREE.Matrix4().copy(ref.current.matrix)
          tempMatrix.setPosition(intendedNewPosition)

          const deltaLocalMatrix = tempMatrix.clone().multiply(previousLocalMatrix.invert())
          const deltaWorldMatrix = tempMatrix.clone().multiply(previousWorldMatrix.invert())

          onDrag && onDrag(tempMatrix, deltaLocalMatrix, ref.current.matrixWorld, deltaWorldMatrix)
        }

        invalidate()
      },
      [autoTransform, dragLimits, threshold, onDragStart, onDrag, invalidate]
    )

    const handlePointerUp = React.useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!dragState.current.active || event.pointerId !== dragState.current.pointerId) return
        ;(event.target as HTMLElement).releasePointerCapture(event.pointerId)

        const wasIntentional = dragState.current.intentional

        dragState.current.active = false
        dragState.current.intentional = false
        dragState.current.pointerId = -1

        if (defaultControls) defaultControls.enabled = true

        // Only fire onDragEnd if it was an intentional drag (or filterTaps is false)
        if (wasIntentional || !filterTaps) {
          onDragEnd && onDragEnd()
        }

        invalidate()
      },
      [defaultControls, filterTaps, onDragEnd, invalidate]
    )

    const handlePointerEnter = React.useCallback(() => {
      onHover && onHover(true)
    }, [onHover])

    const handlePointerLeave = React.useCallback(() => {
      onHover && onHover(false)
    }, [onHover])

    React.useImperativeHandle(fRef, () => ref.current, [])

    React.useLayoutEffect(() => {
      if (!matrix) return

      // If the matrix is a real matrix4 it means that the user wants to control the gizmo
      // In that case it should just be set, as a bare prop update would merely copy it
      ref.current.matrix = matrix
    }, [matrix])

    return (
      <group
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        matrix={matrix}
        matrixAutoUpdate={false}
        {...props}
      >
        {children}
      </group>
    )
  }
)
