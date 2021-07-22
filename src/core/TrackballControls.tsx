import * as React from 'react'
import { PerspectiveCamera } from 'three'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
import { TrackballControls as TrackballControlsImpl } from 'three-stdlib'

export type TrackballControls = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<TrackballControlsImpl, typeof TrackballControlsImpl>,
  { target?: ReactThreeFiber.Vector3; camera?: THREE.Camera; regress?: boolean; makeDefault?: boolean }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      trackballControlsImpl: TrackballControls
    }
  }
}

export const TrackballControls = React.forwardRef<TrackballControlsImpl, TrackballControls>(
  ({ makeDefault, camera, regress, ...restProps }, ref) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)
    const set = useThree(({ set }) => set)
    const get = useThree(({ get }) => get)
    const performance = useThree(({ performance }) => performance)
    const explCamera = camera || defaultCamera
    const controls = React.useMemo(
      () => new TrackballControlsImpl(explCamera as PerspectiveCamera, gl.domElement),
      [explCamera, gl.domElement]
    )

    useFrame(() => {
      if (controls.enabled) controls.update()
    })

    React.useEffect(() => {
      const callback = () => {
        invalidate()
        if (regress) performance.regress()
      }

      controls.addEventListener('change', callback)
      return () => {
        controls.removeEventListener('change', callback)
        controls.dispose()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regress, controls, invalidate])

    React.useEffect(() => {
      if (makeDefault) {
        // @ts-expect-error new in @react-three/fiber@7.0.5
        const old = get().controls
        // @ts-expect-error new in @react-three/fiber@7.0.5
        set({ controls })
        // @ts-expect-error new in @react-three/fiber@7.0.5
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    return <primitive ref={ref} object={controls} {...restProps} />
  }
)
