import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import type { Inspector as ThreeInspector } from 'three/examples/jsm/inspector/Inspector.js'
import type { WebGPURenderer } from 'three/webgpu'
import type { InspectorSession } from './inspector-runtime'

// Turbopack dev evaluates the Inspector/Settings import cycle before Inspector's
// Three namespace is assigned, causing an undefined REVISION read. Loading Settings
// first initializes Inspector's imports before that read and applies saved settings
// before renderer creation. The browser guard keeps this initialization out of SSR.
if (typeof window !== 'undefined') {
  await import('three/examples/jsm/inspector/tabs/Settings.js')
}

// null means the inspector is attaching. undefined means there is no provider.
const InspectorContext = React.createContext<ThreeInspector | null | undefined>(undefined)

export type InspectorProps = React.PropsWithChildren<{
  /** Hide the panel while keeping profiling and controls initialized. */
  hide?: boolean
}>

export function useInspectorContext() {
  const inspector = React.useContext(InspectorContext)
  if (inspector === undefined) throw new Error('useInspectorControls must be used inside <Inspector>.')
  return inspector
}

/** Three's inspector for R3F v10 WebGPU canvases with frameloop="always". */
export function Inspector({ children, hide = false }: InspectorProps) {
  const renderer = useThree((state) => state.renderer) as WebGPURenderer
  const isLegacy = useThree((state) => state.isLegacy)
  const frameloop = useThree((state) => state.frameloop)
  const eventSource = useThree((state) => state.events.connected)
  const invalidate = useThree((state) => state.invalidate)
  const [inspector, setInspector] = React.useState<ThreeInspector | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const session = React.useRef<InspectorSession | null>(null)
  const hidden = React.useRef(hide)
  hidden.current = hide

  React.useEffect(() => {
    if (isLegacy) {
      setError(new Error('Inspector requires an R3F v10 WebGPU renderer. Use <Canvas renderer={true}>.'))
      return
    }
    if (frameloop !== 'always') {
      setError(
        new Error('Inspector currently requires frameloop="always". Demand and manual rendering are not supported.')
      )
      return
    }

    const controller = new AbortController()
    let current: InspectorSession | undefined
    Promise.all([import('./inspector-runtime'), renderer.init()])
      .then(async ([{ attachInspector }]) => {
        if (controller.signal.aborted) return
        current = await attachInspector(renderer, eventSource, controller.signal)
        if (controller.signal.aborted) {
          current.release()
          return
        }
        current.inspector.domElement.style.display = hidden.current ? 'none' : ''
        session.current = current
        setInspector(current.inspector)
        invalidate()
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason : new Error(String(reason)))
      })

    return () => {
      controller.abort()
      session.current = null
      setInspector(null)
      current?.release()
    }
  }, [renderer, isLegacy, frameloop, eventSource, invalidate])

  React.useEffect(() => {
    if (inspector) inspector.domElement.style.display = hide ? 'none' : ''
  }, [inspector, hide])

  // Bracket this canvas's work using R3F's frame phases.
  useFrame(() => session.current?.begin(), { phase: 'start', priority: Infinity })
  useFrame(() => session.current?.finish(), { phase: 'finish', priority: -Infinity })

  if (error) throw error
  return <InspectorContext.Provider value={inspector}>{children}</InspectorContext.Provider>
}
