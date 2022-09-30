import * as THREE from 'three'
import * as React from 'react'

export type PivotContext = {
  onDragStart: (component: 'Arrow' | 'Slider' | 'Rotator') => void
  onDrag: (mdW: THREE.Matrix4) => void
  onDragEnd: () => void
  translation: { current: [number, number, number] }
  translationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  rotationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  axisColors: [string | number, string | number, string | number]
  hoveredColor: string | number
  opacity: number
  scale: number
  lineWidth: number
  fixed: boolean
  displayValues: boolean
  depthTest: boolean
  userData?: { [key: string]: any }
  annotationsClass?: string
}

export const context = React.createContext<PivotContext>(null!)
