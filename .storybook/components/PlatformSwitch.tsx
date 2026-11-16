import * as React from 'react'
import { Canvas, CanvasProps, RendererSettingsConfig, RootState, ShadowsConfig } from '@react-three/fiber'
import { Canvas as LegacyCanvas } from '@react-three/fiber/legacy'
import { useThree } from '@react-three/fiber/extension'
import type { WebGLRenderer, WebGLRendererParameters } from 'three'
import type { WebGPURendererParameters } from 'three/webgpu'

export function PlatformSwitch({ legacy, webgpu }: { legacy: React.ReactNode; webgpu: React.ReactNode }) {
  const isLegacy = useThree((state) => state.isLegacy)
  return isLegacy ? legacy : webgpu
}

export type SwitchCanvasProps = Omit<CanvasProps, 'onCreated' | 'gl' | 'renderer' | 'primary' | 'share'> & {
  onCreated?: (state: RootState) => void
  asLegacy?: boolean
  shadows?: ShadowsConfig
  rendererParams?: Partial<
    WebGLRendererParameters & WebGPURendererParameters & Pick<WebGLRenderer, 'toneMapping' | 'outputColorSpace'>
  > &
    RendererSettingsConfig
}

export function SwitchCanvas({ asLegacy = false, rendererParams, shadows, ...props }: SwitchCanvasProps) {
  if (asLegacy) return <LegacyCanvas key="legacy" {...props} gl={{ shadows, ...rendererParams }} />
  return <Canvas key="webgpu" {...props} renderer={{ shadows, ...rendererParams }} />
}
