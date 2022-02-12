import * as React from 'react'
import { CameraHelper, OrthographicCamera as OrthographicCameraImpl } from 'three'
import { useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import { useHelper } from './useHelper'

type Props = JSX.IntrinsicElements['orthographicCamera'] & {
  makeDefault?: boolean
  manual?: boolean
  children?: React.ReactNode
  helper?: boolean
}

export const OrthographicCamera = React.forwardRef(({ makeDefault, helper, ...props }: Props, ref) => {
  const set = useThree(({ set }) => set)
  const camera = useThree(({ camera }) => camera)
  const size = useThree(({ size }) => size)

  const cameraRef = React.useRef<OrthographicCameraImpl>()

  useHelper(helper && cameraRef, CameraHelper)

  React.useLayoutEffect(() => {
    if (cameraRef.current && !props.manual) {
      cameraRef.current.updateProjectionMatrix()
    }
  }, [size, props])

  React.useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      set(() => ({ camera: cameraRef.current! }))
      return () => set(() => ({ camera: oldCam }))
    }
  }, [camera, cameraRef, makeDefault, set])

  return (
    <orthographicCamera
      left={size.width / -2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={size.height / -2}
      ref={mergeRefs([cameraRef, ref])}
      {...props}
    />
  )
})
