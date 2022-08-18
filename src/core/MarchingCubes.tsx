import * as React from 'react'
import { Color, Group, MeshStandardMaterial } from 'three'
import { MarchingCubes as MarchingCubesImpl } from 'three-stdlib'
import { useFrame } from '@react-three/fiber'

type Api = {
  getParent: () => React.MutableRefObject<MarchingCubesImpl>
}

const globalContext = React.createContext<Api>(null!)

export type MarchingCubesProps = {
  resolution?: number
  maxPolyCount?: number
  enableUvs?: boolean
  enableColors?: boolean
} & JSX.IntrinsicElements['group']

export const MarchingCubes = React.forwardRef(
  (
    {
      resolution = 28,
      maxPolyCount = 10000,
      enableUvs = false,
      enableColors = false,
      children,
      ...props
    }: MarchingCubesProps,
    ref
  ) => {
    const marchingCubesRef = React.useRef<MarchingCubesImpl>(null!)
    React.useImperativeHandle(ref, () => marchingCubesRef.current)
    const marchingCubes = React.useMemo(
      () => new MarchingCubesImpl(resolution, new MeshStandardMaterial(), enableUvs, enableColors, maxPolyCount),
      [resolution, maxPolyCount, enableUvs, enableColors]
    )

    const api = React.useMemo(
      () => ({
        getParent: () => marchingCubesRef,
      }),
      []
    )

    useFrame(() => {
      marchingCubes.reset()
    }, -1) // To make sure the reset runs before the balls or planes are added

    return (
      <>
        <primitive object={marchingCubes} ref={marchingCubesRef} {...props}>
          <globalContext.Provider value={api}>{children}</globalContext.Provider>
        </primitive>
      </>
    )
  }
)

type MarchingCubeProps = {
  strength?: number
  subtract?: number
  color?: Color
} & JSX.IntrinsicElements['group']

export const MarchingCube = React.forwardRef(
  ({ strength = 0.5, subtract = 12, color = new Color('#fff'), ...props }: MarchingCubeProps, ref) => {
    const { getParent } = React.useContext(globalContext)
    const parentRef = React.useMemo(() => getParent(), [getParent])
    const cubeRef = React.useRef<Group>(null!)
    React.useImperativeHandle(ref, () => cubeRef.current)

    useFrame(() => {
      parentRef.current.addBall(
        cubeRef.current.position.x,
        cubeRef.current.position.y,
        cubeRef.current.position.z,
        strength,
        subtract,
        color
      )
    })

    return <group ref={cubeRef} {...props} />
  }
)

type MarchingPlaneProps = {
  planeType?: 'x' | 'y' | 'z'
  strength?: number
  subtract?: number
} & JSX.IntrinsicElements['group']

export const MarchingPlane = React.forwardRef(
  ({ planeType: _planeType = 'x', strength = 0.5, subtract = 12, ...props }: MarchingPlaneProps, ref) => {
    const { getParent } = React.useContext(globalContext)
    const parentRef = React.useMemo(() => getParent(), [getParent])
    const wallRef = React.useRef<Group>(null!)
    React.useImperativeHandle(ref, () => wallRef.current)
    const planeType = React.useMemo(
      () => (_planeType === 'x' ? 'addPlaneX' : _planeType === 'y' ? 'addPlaneY' : 'addPlaneZ'),
      [_planeType]
    )

    useFrame(() => {
      parentRef.current[planeType](strength, subtract)
    })
    return <group ref={wallRef} {...props} />
  }
)
