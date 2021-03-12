import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import useEffectfulState from '../helpers/useEffectfulState'

export type OrbitControls = Overwrite<
  ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
  }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControlsImpl: OrbitControls
    }
  }
}

export const OrbitControls = React.forwardRef((props: OrbitControls = { enableDamping: true }, ref) => {
  const { camera, ...rest } = props
  const { camera: defaultCamera, gl, invalidate } = useThree(({ camera, gl, invalidate }) => ({
    camera,
    gl,
    invalidate,
  }))
  const explCamera = camera || defaultCamera

  const controls = useEffectfulState<OrbitControlsImpl | undefined>(
    () => {
      if (explCamera) {
        return new OrbitControlsImpl(explCamera, gl.domElement)
      }
    },
    [explCamera, gl],
    ref as any
  )

  useFrame(() => controls?.update())

  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  return controls ? <primitive dispose={undefined} object={controls} enableDamping {...rest} /> : null
})
