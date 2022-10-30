import * as React from 'react'
import create, { GetState, StateSelector, Subscribe, UseBoundStore } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type KeyboardControlsState<T extends string = string> = { [K in T]: boolean }

export type KeyboardControlsEntry<T extends string = string> = {
  /** Name of the action */
  name: T
  /** The keys that define it, you can use either event.key, or event.code */
  keys: string[]
  /** If the event receives the keyup event, true by default */
  up?: boolean
}

type KeyboardControlsProps = {
  /** A map of named keys */
  map: KeyboardControlsEntry[]
  /** All children will be able to useKeyboardControls */
  children: React.ReactNode
  /** Optional onchange event */
  onChange?: (name: string, pressed: boolean, state: KeyboardControlsState) => void
  /** Optional event source */
  domElement?: HTMLElement
}

type KeyboardControlsApi<T extends string = string> = [
  Subscribe<KeyboardControlsState<T>>,
  GetState<KeyboardControlsState<T>>,
  UseBoundStore<KeyboardControlsState<T>>
]

const context = /*@__PURE__*/ React.createContext<KeyboardControlsApi>(null!)

export function KeyboardControls({ map, children, onChange, domElement }: KeyboardControlsProps) {
  const key = map.map((item) => item.name + item.keys).join('-')
  const useControls = React.useMemo(() => {
    return create<KeyboardControlsState>(
      subscribeWithSelector(() => map.reduce((prev, cur) => ({ ...prev, [cur.name]: false }), {}))
    )
  }, [key])
  const api: KeyboardControlsApi = React.useMemo(
    () => [useControls.subscribe, useControls.getState, useControls],
    [key]
  )
  const set = useControls.setState

  React.useEffect(() => {
    const config = map.map(({ name, keys, up }) => ({
      keys,
      up,
      fn: (value) => {
        // Set zustand state
        set({ [name]: value })
        // Inform callback
        if (onChange) onChange(name, value, api[2]())
      },
    }))
    const keyMap = config.reduce((out, { keys, fn, up = true }) => {
      keys.forEach((key) => (out[key] = { fn, pressed: false, up }))
      return out
    }, {})

    const downHandler = ({ key, code }: KeyboardEvent) => {
      const obj = keyMap[key] || keyMap[code]
      if (!obj) return
      const { fn, pressed, up } = obj
      obj.pressed = true
      if (up || !pressed) fn(true)
    }

    const upHandler = ({ key, code }: KeyboardEvent) => {
      const obj = keyMap[key] || keyMap[code]
      if (!obj) return
      const { fn, up } = obj
      obj.pressed = false
      if (up) fn(false)
    }

    const source = domElement || window
    source.addEventListener('keydown', downHandler as EventListenerOrEventListenerObject, { passive: true })
    source.addEventListener('keyup', upHandler as EventListenerOrEventListenerObject, { passive: true })

    return () => {
      source.removeEventListener('keydown', downHandler as EventListenerOrEventListenerObject)
      source.removeEventListener('keyup', upHandler as EventListenerOrEventListenerObject)
    }
  }, [domElement, key])

  return <context.Provider value={api} children={children} />
}

type Selector<T extends string = string> = (state: KeyboardControlsState<T>) => boolean

export function useKeyboardControls<T extends string = string>(): [
  Subscribe<KeyboardControlsState<T>>,
  GetState<KeyboardControlsState<T>>
]
export function useKeyboardControls<T extends string = string>(sel: Selector<T>): ReturnType<Selector<T>>
export function useKeyboardControls<T extends string = string>(
  sel?: Selector<T>
): ReturnType<Selector<T>> | [Subscribe<KeyboardControlsState<T>>, GetState<KeyboardControlsState<T>>] {
  const [sub, get, store] = React.useContext<KeyboardControlsApi<T>>(context)
  if (sel) return store(sel)
  else return [sub, get]
}
