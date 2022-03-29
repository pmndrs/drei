import * as React from 'react'
import * as THREE from 'three'
import { SelectionBox } from 'three-stdlib'
import { useThree } from '@react-three/fiber'
import shallow from 'zustand/shallow'

const context = React.createContext<THREE.Object3D[]>([])

type Props = JSX.IntrinsicElements['group'] & {
  multiple?: boolean
  box?: boolean
  border?: string
  backgroundColor?: string
  onChange?: (selected: THREE.Object3D[]) => void
  filter?: (selected: THREE.Object3D[]) => THREE.Object3D[]
}

export function Select({
  box,
  multiple,
  children,
  onChange,
  border = '1px solid #55aaff',
  backgroundColor = 'rgba(75, 160, 255, 0.1)',
  filter: customFilter = (item) => item,
  ...props
}: Props) {
  const { setEvents, camera, raycaster, gl, controls, size, get } = useThree()
  const [hovered, hover] = React.useState(false)
  const [active, dispatch] = React.useReducer(
    (state, { object, shift }: { object?: THREE.Object3D | THREE.Object3D[]; shift?: boolean }): THREE.Object3D[] => {
      if (object === undefined) return []
      else if (Array.isArray(object)) return object
      else if (!shift) return state[0] === object ? [] : [object]
      else if (state.includes(object)) return state.filter((o) => o !== object)
      else return [object, ...state]
    },
    []
  )
  React.useEffect(() => void onChange?.(active), [active])
  const onClick = React.useCallback((e) => {
    e.stopPropagation()
    dispatch({ object: customFilter([e.object])[0], shift: multiple && e.shiftKey })
  }, [])
  const onPointerMissed = React.useCallback((e) => !hovered && dispatch({}), [hovered])

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

    function prepareRay(event, vec) {
      const { offsetX, offsetY } = event
      const { width, height } = size
      vec.set((offsetX / width) * 2 - 1, -(offsetY / height) * 2 + 1)
    }

    function onSelectStart(event) {
      if (controls) (controls as any).enabled = false
      setEvents({ enabled: false })
      isDown = true
      gl.domElement.parentElement?.appendChild(element)
      element.style.left = `${event.clientX}px`
      element.style.top = `${event.clientY}px`
      element.style.width = '0px'
      element.style.height = '0px'
      startPoint.x = event.clientX
      startPoint.y = event.clientY
    }

    function onSelectMove(event) {
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
        isDown = false
        element.parentElement?.removeChild(element)
      }
    }

    function pointerDown(event) {
      if (event.shiftKey) {
        onSelectStart(event)
        prepareRay(event, selBox.startPoint)
      }
    }

    let previous: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[] = []
    function pointerMove(event) {
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

    function pointerUp(event) {
      if (isDown) onSelectOver()
    }

    document.addEventListener('pointerdown', pointerDown, { passive: true })
    document.addEventListener('pointermove', pointerMove, { passive: true, capture: true })
    document.addEventListener('pointerup', pointerUp, { passive: true })

    return () => {
      document.removeEventListener('pointerdown', pointerDown)
      document.removeEventListener('pointermove', pointerMove)
      document.removeEventListener('pointerup', pointerUp)
    }
  }, [size, raycaster, camera, controls, gl])

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

export function useSelect() {
  return React.useContext(context)
}
