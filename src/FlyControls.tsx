import { Clock } from 'three'
import React, { forwardRef, useRef, useEffect } from 'react'
import { ReactThreeFiber, extend, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { FlyControls as FlyControlsImpl } from 'three/examples/jsm/controls/FlyControls'
// @ts-ignore
import mergeRefs from 'react-merge-refs'

extend({ FlyControlsImpl })

export type FlyControls = Overwrite<
  ReactThreeFiber.Object3DNode<FlyControlsImpl, typeof FlyControlsImpl>,
  { target?: ReactThreeFiber.Vector3 }
>

export interface FlyControlsProps extends FlyControls {
  clock: Clock
}

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/interface-name-prefix
    interface IntrinsicElements {
      flyControlsImpl: FlyControls
    }
  }
}

export const FlyControls = forwardRef(({ clock, ...props }: FlyControlsProps, ref) => {
  const controls = useRef<FlyControlsImpl>()
  const { camera, gl } = useThree()
  useFrame(() => controls.current?.update(clock.getDelta()))
  useEffect(() => {
    const ctrls = controls.current
    return () => ctrls?.dispose()
  }, [])
  return <flyControlsImpl ref={mergeRefs([controls, ref])} args={[camera, gl.domElement]} {...props} />
})
