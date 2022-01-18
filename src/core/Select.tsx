import * as React from 'react'
import * as THREE from 'three'

const context = React.createContext<THREE.Object3D[]>([])

type Props = JSX.IntrinsicElements['group'] & {
  multiple?: boolean
  onChange?: (selected: THREE.Object3D[]) => void
}

export function Select({ multiple, children, onChange, ...props }: Props) {
  const [hovered, hover] = React.useState(false)
  const [active, dispatch] = React.useReducer(
    (state, { object, shift }: { object?: THREE.Object3D; shift?: boolean }): THREE.Object3D[] => {
      if (object === undefined) return []
      else if (!shift) return state[0] === object ? [] : [object]
      else if (state.includes(object)) return state.filter((o) => o !== object)
      else return [object, ...state]
    },
    []
  )
  React.useEffect(() => void onChange?.(active), [active])
  const onClick = React.useCallback((e) => {
    e.stopPropagation()
    dispatch({ object: e.object, shift: multiple && e.shiftKey })
  }, [])
  const onPointerMissed = React.useCallback((e) => !hovered && dispatch({}), [hovered])
  return (
    <group
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
