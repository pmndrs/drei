import { Box, Html, Text3D, useContextBridge } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import * as React from 'react'

//* useContextBridge Demo ==============================

type ThemeContext = { colors: { red: string; green: string; blue: string } }
type GreetingContext = {
  name: string
  setName: React.Dispatch<React.SetStateAction<string>>
}

function ContextBridge({ contexts, children }: { contexts: React.Context<any>[] } & { children?: React.ReactNode }) {
  // Cast needed due to React types version mismatch between packages
  useContextBridge(...(contexts as any))

  return <>{children}</>
}

const ThemeContext = React.createContext<ThemeContext>(null!)
const GreetingContext = React.createContext<GreetingContext>(null!)

function Scene() {
  // we can now use the context within the canvas via the regular hook
  const theme = React.useContext(ThemeContext)
  const greeting = React.useContext(GreetingContext)
  return (
    <>
      <Box
        position-x={-4}
        args={[3, 2]}
        material-color={theme.colors.red}
        onClick={() => greeting.setName(theme.colors.red)}
      />
      <Box
        position-x={0}
        args={[3, 2]}
        material-color={theme.colors.green}
        onClick={() => greeting.setName(theme.colors.green)}
      />
      <Box
        position-x={4}
        args={[3, 2]}
        material-color={theme.colors.blue}
        onClick={() => greeting.setName(theme.colors.blue)}
      />

      <React.Suspense fallback={null}>
        <Html center>
          <p>{greeting.name ? `Hello ${greeting.name}!` : 'Click a color'}</p>
        </Html>
      </React.Suspense>
    </>
  )
}

function SceneWrapper() {
  return (
    <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
      <ContextBridge contexts={[ThemeContext, GreetingContext]}>
        <Scene />
      </ContextBridge>
    </CanvasWithToggle>
  )
}

export default function UseContextBridgeDemo() {
  const [name, setName] = React.useState('')
  return (
    <div className="demo-container">
      <ExampleCard demoName="useContextBridge" />

      <div className="demo-canvas">
        <ThemeContext.Provider value={{ colors: { red: '#ff0000', green: '#00ff00', blue: '#0000ff' } }}>
          <GreetingContext.Provider value={{ name, setName }}>
            <SceneWrapper />
          </GreetingContext.Provider>
        </ThemeContext.Provider>
      </div>
    </div>
  )
}
