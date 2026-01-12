// takes two components and based on the active platform outputs them

import { Canvas, useThree } from '@react-three/fiber'
import React from 'react'
import { useState, useEffect } from 'react'

export function PlatformSwitch({ legacy, webgpu }: { legacy: React.ReactNode; webgpu: React.ReactNode }) {
  const { isLegacy } = useThree()
  return isLegacy ? legacy : webgpu
}

// wraps the canvas but flips the canvas to webgl or renderer (usefull for testing)

type SwitchCanvasProps = React.ComponentProps<typeof Canvas> & {
  asLegacy?: boolean
  rendererParams?: React.ComponentProps<typeof Canvas>['renderer']
}

export function SwitchCanvas({ asLegacy = false, rendererParams, ...props }: SwitchCanvasProps) {
  // have to be harsher to rest things not just prop switching
  if (asLegacy) return <Canvas {...props} gl={rendererParams} />
  // For WebGPU: renderer={true} triggers WebGPU mode, renderer={undefined} doesn't
  return <Canvas key="webgpu" renderer={rendererParams ?? true} {...props} />
}

// has a UI toggle to switch the renderer and saved to local storage

interface CanvasWithToggleProps extends React.ComponentProps<typeof Canvas> {
  rendererParams?: React.ComponentProps<typeof Canvas>['renderer']
}
