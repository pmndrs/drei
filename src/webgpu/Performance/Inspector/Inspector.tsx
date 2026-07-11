import { useThree } from '@react-three/fiber'
import * as React from 'react'
import { PropsWithChildren } from 'react'
import * as THREE from 'three/webgpu'

import { Inspector as ThreeInspector } from 'three/examples/jsm/inspector/Inspector.js'
export { ThreeInspector }

const InspectorContext = React.createContext<ThreeInspector | null>(null)

export type InspectorProps = PropsWithChildren<{
  /** Hide the inspector panel while keeping it initialized, default: false */
  hide?: boolean
}>

function isConnectTarget(value: unknown): value is HTMLElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    'addEventListener' in value &&
    typeof (value as { addEventListener?: unknown }).addEventListener === 'function'
  )
}

export function useInspectorContext() {
  const inspector = React.useContext(InspectorContext)
  if (!inspector) {
    throw new Error('useInspectorControls must be used inside <Inspector>.')
  }
  return inspector
}

/**
 * The Inspector bundled with Three.js.
 *
 * @param hide Hide the inspector panel while keeping it initialized.
 *
 * @example
 * <Inspector hide={false}>
 *   <Scene />
 * </Inspector>
 */
export function Inspector({ children = null, hide = false }: InspectorProps = {}) {
  const inspectorRef = React.useRef<ThreeInspector | null>(null)
  if (!inspectorRef.current) inspectorRef.current = new ThreeInspector()

  const inspector = inspectorRef.current
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer
  const events = useThree((s) => s.events)
  const set = useThree((s) => s.set)
  const advance = useThree((s) => s.advance)
  const frameloop = useThree((s) => s.frameloop)

  React.useLayoutEffect(() => {
    const dom = inspector.domElement as HTMLElement
    dom.hidden = hide
  }, [hide, inspector])

  React.useLayoutEffect(() => {
    set({ frameloop: 'never' })

    gl.inspector = inspector
    inspector.init()

    const canvasTarget = gl.domElement
    const prevEventTarget = isConnectTarget(events.connected) ? events.connected : canvasTarget
    if (isConnectTarget(canvasTarget)) events.connect?.(canvasTarget)

    // Stop control events from bubbling to the canvas (R3F / OrbitControls).
    const dom = inspector.domElement as HTMLElement
    const stop = (e: Event) => e.stopPropagation()
    const events_ = ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'contextmenu', 'click', 'dblclick'] as const
    for (const name of events_) dom.addEventListener(name, stop)

    gl.setAnimationLoop((time) => advance(time))

    return () => {
      for (const name of events_) dom.removeEventListener(name, stop)
      set({ frameloop })
      gl.setAnimationLoop(null)

      const restoreTarget = isConnectTarget(prevEventTarget) ? prevEventTarget : canvasTarget
      if (isConnectTarget(restoreTarget)) events.connect?.(restoreTarget)

      if (gl.inspector === inspector) delete (gl as unknown as { inspector?: ThreeInspector }).inspector
    }
  }, [gl, inspector])

  return <InspectorContext.Provider value={inspector}>{children}</InspectorContext.Provider>
}
