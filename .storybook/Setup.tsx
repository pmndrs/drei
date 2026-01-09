import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, CanvasProps } from '@react-three/fiber'

import { OrbitControls } from '../src'

type OnlyTagProps = {
  type: 'legacy' | 'webgpu' | null
}

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

type SwitchCanvasProps = React.ComponentProps<typeof Canvas> & {
  asLegacy?: boolean
  rendererParams?: React.ComponentProps<typeof Canvas>['renderer']
}

export function SwitchCanvas({ asLegacy = false, rendererParams, ...props }: SwitchCanvasProps) {
  // have to be harsher to rest things not just prop switching
  if (asLegacy) return <Canvas key="legacy" {...props} gl={rendererParams} />
  // For WebGPU: renderer={true} triggers WebGPU mode, renderer={undefined} doesn't
  return <Canvas key="webgpu" renderer={rendererParams ?? true} {...props} />
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
  }
>

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
  ...restProps
}: SetupProps) => {
  const isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
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
