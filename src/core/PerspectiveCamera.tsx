import * as React from 'react'
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

type Props = JSX.IntrinsicElements['perspectiveCamera'] & {
  makeDefault?: boolean
  children?: React.ReactNode
}

export const PerspectiveCamera = React.forwardRef(({ makeDefault = false, ...props }: Props, ref) => {
  const set = useThree(({ set }) => set)
  const camera = useThree(({ camera }) => camera)
  const size = useThree(({ size }) => size)
  const cameraRef = React.useRef<PerspectiveCameraImpl>()

  React.useLayoutEffect(() => {
    const { current: cam } = cameraRef
    if (cam) {
      cam.aspect = size.width / size.height
      cam.updateProjectionMatrix()
    }
  }, [size, props])

  React.useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      set(() => ({
        camera: cameraRef.current!,
      }))
      return () =>
        set(() => ({
          camera: oldCam,
        }))
    }
  }, [camera, cameraRef, makeDefault, set])

  return <perspectiveCamera ref={mergeRefs([cameraRef, ref])} {...props} />
})
