import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, CanvasProps, useThree } from '@react-three/fiber'

import { OrbitControls } from '../src'
import { getTestEnvironment } from './testing'

//* Types ==============================

type OnlyTagProps = {
  type: 'legacy' | 'webgpu' | null
}

type SwitchCanvasProps = React.ComponentProps<typeof Canvas> & {
  asLegacy?: boolean
  rendererParams?: React.ComponentProps<typeof Canvas>['renderer']
}

type SetupProps = React.PropsWithChildren<
  CanvasProps & {
    cameraFov?: number
    cameraPosition?: Vector3
    controls?: boolean
    lights?: boolean
    floor?: boolean
    renderer?: 'legacy' | 'webgpu'
    limitedTo?: 'legacy' | 'webgpu' | null
    rendererParams?: React.ComponentProps<typeof Canvas>['renderer']
    /** Override animation freeze behavior (default: auto-detect from test environment) */
    freezeAnimations?: boolean
  }
>

//* Test Environment ==============================

// Cache test environment detection (stable during session)
const testEnv = getTestEnvironment()

//* OnlyTag Component ==============================
// Visual indicator for platform-specific stories

const OnlyTag: React.FC<OnlyTagProps> = ({ type }) => {
  if (type !== 'legacy' && type !== 'webgpu') return null

  const isLegacy = type === 'legacy'
  const style: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 20,
    padding: '2px 8px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 4,
    pointerEvents: 'none',
    border: `2px solid ${isLegacy ? '#ffd600' : '#3793fe'}`,
    color: isLegacy ? '#ffd600' : '#3793fe',
    background: 'rgba(24,27,33,0.88)',
    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.13)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }

  return (
    <div style={style} data-testid="onlytag">
      {isLegacy ? 'Legacy Only' : 'WebGPU Only'}
    </div>
  )
}

//* Scheduler Control ==============================
// Uses R3F v10's scheduler to pause the render loop for visual testing

function SchedulerPause() {
  const { set } = useThree()

  React.useEffect(() => {
    // R3F v10 exposes `set` which can update store state including frameloop
    // Setting frameloop to 'never' stops the scheduler completely
    // 'demand' would allow manual advances via invalidate()
    set({ frameloop: 'never' })

    return () => {
      // Restore on unmount (though in tests this rarely matters)
      set({ frameloop: 'always' })
    }
  }, [set])

  return null
}

//* SwitchCanvas Component ==============================
// Switches between Legacy (WebGL) and WebGPU renderers

export function SwitchCanvas({ asLegacy = false, rendererParams, ...props }: SwitchCanvasProps) {
  // Key forces remount when switching renderers
  if (asLegacy) return <Canvas key="legacy" {...props} gl={rendererParams} />

  // For WebGPU: renderer={true} triggers WebGPU mode
  return <Canvas key="webgpu" renderer={rendererParams ?? true} {...props} />
}

//* Setup Component ==============================
// Main decorator for Storybook stories - handles renderer switching, scene setup, and test environment

export const Setup = ({
  children,
  cameraFov = 75,
  cameraPosition = new Vector3(-5, 5, 5),
  controls = true,
  lights = true,
  floor = true,
  renderer = 'webgpu',
  limitedTo = null,
  rendererParams = null,
  freezeAnimations,
  ...restProps
}: SetupProps) => {
  // Determine if we should use legacy renderer
  const isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')

  // Determine if we should freeze animations
  // Priority: explicit prop > test environment detection
  const shouldFreeze = freezeAnimations ?? testEnv.shouldFreezeAnimations

  return (
    <>
      <OnlyTag type={limitedTo} />
      <SwitchCanvas
        asLegacy={isLegacy}
        rendererParams={{ antialias: true, ...rendererParams }}
        shadows
        camera={{ position: cameraPosition, fov: cameraFov }}
        {...restProps}
      >
        {/* Pause scheduler if in visual test environment */}
        {shouldFreeze && <SchedulerPause />}

        {children}

        {lights && (
          <>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -10]} color="#ff6b6b" intensity={0.5} />
          </>
        )}

        {controls && <OrbitControls makeDefault />}

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        {/* Grid */}
        {floor && <gridHelper args={[20, 20, '#444', '#333']} position={[0, -2, 0]} />}
      </SwitchCanvas>
    </>
  )
}

//* Re-exports ==============================
// Export testing utilities for use in stories

export { getTestEnvironment, isTesting, shouldFreezeAnimations, useTestEnvironment } from './testing'
export {
  createPlatformVariant,
  createPlatformVariants,
  withChromaticParams,
  generatePlatformVariants,
} from './variants'
