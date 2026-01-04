// takes two components and based on the active platform outputs them

import { Canvas, useThree } from '@react-three/fiber'
import { Switch } from './ui/switch'
import { useState, useEffect } from 'react'

export function PlatformSwitch({ legacy, webgpu }: { legacy: React.ReactNode; webgpu: React.ReactNode }) {
  const { isLegacy } = useThree()
  return isLegacy ? legacy : webgpu
}

// wraps the canvas but flips the canvas to webgl or renderer (usefull for testing)

type SwitchCanvasProps = React.ComponentProps<typeof Canvas> & {
  asLegacy?: boolean
}

export function SwitchCanvas({ asLegacy = false, ...props }: SwitchCanvasProps) {
  // have to be harsher to rest things not just prop switching
  if (asLegacy) return <Canvas {...props} />
  return <Canvas key="webgpu" renderer {...props} />
}

// has a UI toggle to switch the renderer and saved to local storage

export function CanvasWithToggle(props: React.ComponentProps<typeof Canvas>) {
  const [isLegacy, setIsLegacy] = useState(localStorage.getItem('isLegacy') === 'true')
  useEffect(() => {
    localStorage.setItem('isLegacy', isLegacy.toString())
  }, [isLegacy])
  return (
    <>
      <SwitchCanvas asLegacy={isLegacy} {...props} />
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <label htmlFor="legacy-toggle" className="text-sm text-foreground/70 mr-2" style={{ lineHeight: 1 }}>
          Legacy
        </label>
        <Switch id="legacy-toggle" checked={isLegacy} onCheckedChange={setIsLegacy} />
      </div>
    </>
  )
}
