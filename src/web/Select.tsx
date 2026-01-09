import { ThreeElements, ThreeEvent, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { SelectionBox } from 'three-stdlib'
import { shallow } from 'zustand/shallow'

const context = /* @__PURE__ */ React.createContext<THREE.Object3D[]>([])

export type SelectProps = Omit<ThreeElements['group'], 'ref'> & {
  /** Allow multi select, default: false */
  multiple?: boolean
  /** Allow box select, default: false */
  box?: boolean
  /** Custom CSS border: default: '1px solid #55aaff' */
  border?: string
  /** Curom CSS color, default: 'rgba(75, 160, 255, 0.1)' */
  backgroundColor?: string
  /** Callback for selection changes */
  onChange?: (selected: THREE.Object3D[]) => void
  /** Callback for selection changes once the pointer is up */
  onChangePointerUp?: (selected: THREE.Object3D[]) => void
  /** Optional filter for filtering the selection */
  filter?: (selected: THREE.Object3D[]) => THREE.Object3D[]
}

export function Select({
  box,
  multiple,
  children,
  onChange,
  onChangePointerUp,
  border = '1px solid #55aaff',
  backgroundColor = 'rgba(75, 160, 255, 0.1)',
  filter: customFilter = (item) => item,
  ...props
}: SelectProps) {
  const [downed, down] = React.useState(false)
  const { setEvents, camera, raycaster, gl, controls, size, get } = useThree()
  const [hovered, hover] = React.useState(false)
  const [active, dispatch] = React.useReducer(
    // @ts-expect-error
    (state, { object, shift }: { object?: THREE.Object3D | THREE.Object3D[]; shift?: boolean }): THREE.Object3D[] => {
      if (object === undefined) return []
      else if (Array.isArray(object)) return object
      else if (!shift) return state[0] === object ? [] : [object]
      // @ts-expect-error
      else if (state.includes(object)) return state.filter((o) => o !== object)
      else return [object, ...state]
    },
    []
  )
  React.useEffect(() => {
    if (downed) onChange?.(active)
    else onChangePointerUp?.(active)
  }, [active, downed])
  const onClick = React.useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    dispatch({ object: customFilter([e.object])[0], shift: multiple && e.shiftKey })
  }, [])
  const onPointerMissed = React.useCallback((e: MouseEvent) => !hovered && dispatch({}), [hovered])

  const ref = React.useRef<THREE.Group>(null!)
  React.useEffect(() => {
    if (!box || !multiple) return

    const selBox = new SelectionBox(camera, ref.current as unknown as THREE.Scene)

    const element = document.createElement('div')
    element.style.pointerEvents = 'none'
    element.style.border = border
    element.style.backgroundColor = backgroundColor
    element.style.position = 'fixed'

    const startPoint = new THREE.Vector2()
    const pointTopLeft = new THREE.Vector2()
    const pointBottomRight = new THREE.Vector2()

    const oldRaycasterEnabled = get().events.enabled
    const oldControlsEnabled = (controls as any)?.enabled

    let isDown = false

    function prepareRay(event: PointerEvent, vec: THREE.Vector3) {
      const canvas = gl.domElement
      const rect = canvas.getBoundingClientRect()

      // Calculate position relative to canvas, not the event target
      // This ensures correct calculation even when pointer is over UI elements
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const { width, height } = size
      const normalizedX = (x / width) * 2 - 1
      const normalizedY = -(y / height) * 2 + 1

      vec.set(normalizedX, normalizedY, -1)
    }

    function onSelectStart(event: PointerEvent) {
      if (controls) (controls as any).enabled = false
      setEvents({ enabled: false })
      down((isDown = true))
      gl.domElement.parentElement?.appendChild(element)
      element.style.left = `${event.clientX}px`
      element.style.top = `${event.clientY}px`
      element.style.width = '0px'
      element.style.height = '0px'
      startPoint.x = event.clientX
      startPoint.y = event.clientY
    }

    function onSelectMove(event: PointerEvent) {
      pointBottomRight.x = Math.max(startPoint.x, event.clientX)
      pointBottomRight.y = Math.max(startPoint.y, event.clientY)
      pointTopLeft.x = Math.min(startPoint.x, event.clientX)
      pointTopLeft.y = Math.min(startPoint.y, event.clientY)
      element.style.left = `${pointTopLeft.x}px`
      element.style.top = `${pointTopLeft.y}px`
      element.style.width = `${pointBottomRight.x - pointTopLeft.x}px`
      element.style.height = `${pointBottomRight.y - pointTopLeft.y}px`
    }

    function onSelectOver() {
      if (isDown) {
        if (controls) (controls as any).enabled = oldControlsEnabled
        setEvents({ enabled: oldRaycasterEnabled })
        down((isDown = false))
        element.parentElement?.removeChild(element)
      }
    }

    function pointerDown(event: PointerEvent) {
      if (event.shiftKey) {
        onSelectStart(event)
        prepareRay(event, selBox.startPoint)
      }
    }

    let previous: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[] = []
    function pointerMove(event: PointerEvent) {
      if (isDown) {
        onSelectMove(event)
        prepareRay(event, selBox.endPoint)
        const allSelected = selBox
          .select()
          .sort((o) => (o as any).uuid)
          .filter((o) => o.isMesh)
        if (!shallow(allSelected, previous)) {
          previous = allSelected
          dispatch({ object: customFilter(allSelected) })
        }
      }
    }

    function pointerUp(event: PointerEvent) {
      if (isDown) onSelectOver()
    }

    document.addEventListener('pointerdown', pointerDown, { passive: true })
    document.addEventListener('pointermove', pointerMove, { passive: true, capture: true })
    document.addEventListener('pointerup', pointerUp, { passive: true })

    return () => {
      document.removeEventListener('pointerdown', pointerDown)
      document.removeEventListener('pointermove', pointerMove, true)
      document.removeEventListener('pointerup', pointerUp)
    }
  }, [size.width, size.height, raycaster, camera, controls, gl])

  return (
    <group
      ref={ref}
      onClick={onClick}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
      onPointerMissed={onPointerMissed}
      {...props}
    >
      <context.Provider value={active}>{children}</context.Provider>
    </group>
  )
}

// The return type is explicitly declared here because otherwise TypeScript will emit `THREE.Object3D<THREE.Event>[]`.
// The meaning of the generic parameter for `Object3D` was changed in r156, so it should not be included so that it
// works with all versions of @types/three.
export function useSelect(): THREE.Object3D[] {
  return React.useContext(context)
}
