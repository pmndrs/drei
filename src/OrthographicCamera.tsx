import { OrthographicCamera as OrthographicCameraImpl } from 'three'
import * as React from 'react'
import { useThree, useUpdate } from 'react-three-fiber'
import mergeRefs from 'react-merge-refs'

type Props = JSX.IntrinsicElements['orthographicCamera'] & {
  makeDefault: boolean
  children: React.ReactNode
}

export const OrthographicCamera = React.forwardRef(({ children, makeDefault = false, ...props }: Props, ref) => {
  const { setDefaultCamera, camera, size } = useThree()
  const cameraRef = useUpdate<OrthographicCameraImpl>((cam) => cam.updateProjectionMatrix(), [size, props])

  React.useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      setDefaultCamera(cameraRef.current)
      return () => setDefaultCamera(oldCam)
    }
  }, [camera, cameraRef, makeDefault, setDefaultCamera])

  return (
    <orthographicCamera
      left={size.width / -2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={size.height / -2}
      ref={mergeRefs([cameraRef, ref])}
      {...props}
    >
      {children}
    </orthographicCamera>
  )
})
