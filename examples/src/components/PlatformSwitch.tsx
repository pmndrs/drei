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

import { Switch } from './ui/switch'

type CanvasWithToggleProps = Omit<SwitchCanvasProps, 'asLegacy'>

export function CanvasWithToggle(props: CanvasWithToggleProps) {
  const [isLegacy, setIsLegacy] = React.useState(localStorage.getItem('isLegacy') === 'true')
  React.useEffect(() => {
    localStorage.setItem('isLegacy', isLegacy.toString())
  }, [isLegacy])
  return (
    <>
      <SwitchCanvas asLegacy={isLegacy} rendererParams={props.rendererParams} {...props} />
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-40">
        <label htmlFor="legacy-toggle" className="text-sm text-foreground/70 mr-2" style={{ lineHeight: 1 }}>
          Legacy
        </label>
        <Switch id="legacy-toggle" checked={isLegacy} onCheckedChange={setIsLegacy} />
      </div>
    </>
  )
}
