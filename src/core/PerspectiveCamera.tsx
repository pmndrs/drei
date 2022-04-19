import * as React from 'react'
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

type Props = JSX.IntrinsicElements['perspectiveCamera'] & {
  makeDefault?: boolean
  manual?: boolean
  children?: React.ReactNode
}

export const PerspectiveCamera = React.forwardRef(({ makeDefault, ...props }: Props, ref) => {
  const set = useThree(({ set }) => set)
  const camera = useThree(({ camera }) => camera)
  const size = useThree(({ size }) => size)
  const cameraRef = React.useRef<PerspectiveCameraImpl>()

  React.useLayoutEffect(() => {
    const { current: cam } = cameraRef
    if (cam && !props.manual) {
      cam.aspect = size.width / size.height
      cam.updateProjectionMatrix()
    }
  }, [size, props])

  React.useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      set(() => ({ camera: cameraRef.current! }))
      return () => set(() => ({ camera: oldCam }))
    }
    // The camera should not be part of the dependency list because this components camera is a stable reference
    // that must exchange the default, and clean up after itself on unmount.
  }, [cameraRef, makeDefault, set])

  return <perspectiveCamera ref={mergeRefs([cameraRef, ref])} {...props} />
})
