import * as THREE from '#three'
import * as React from 'react'
import { Line, LineProps } from '#drei-platform'

export type OnDragStartProps = {
  component: 'Arrow' | 'Slider' | 'Rotator' | 'Sphere'
  axis: 0 | 1 | 2
  origin: THREE.Vector3
  directions: THREE.Vector3[]
}

export type OnHoverProps = {
  component: 'Arrow' | 'Slider' | 'Rotator' | 'Sphere'
  axis: 0 | 1 | 2
  hovering: boolean
}

export type PivotContext = {
  onDragStart: (props: OnDragStartProps) => void
  onDrag: (mdW: THREE.Matrix4) => void
  onDragEnd: () => void
  onHover: (props: OnHoverProps) => void
  dragState: React.RefObject<OnDragStartProps | null>
  translation: { current: [number, number, number] }
  translationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  rotationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  scaleLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  axisColors: [string | number, string | number, string | number]
  hoveredColor: string | number
  opacity: number
  scale: number
  lineWidth: number
  fixed: boolean
  depthTest: boolean
  renderOrder: number
  userData?: { [key: string]: any }
  annotations?: boolean
  annotationsClass?: string
  /** Optional Line component override (for storybook platform switching) */
  LineComponent: React.ComponentType<LineProps>
}

// Default Line component
export { Line }

export const context = /* @__PURE__ */ React.createContext<PivotContext>(null!)

export const resolveObject = (
  object?: THREE.Object3D | React.MutableRefObject<THREE.Object3D>,
  fallback?: THREE.Object3D
): THREE.Object3D | undefined => {
  if (!object) return fallback
  if ('current' in object) return object.current
  return object
}
