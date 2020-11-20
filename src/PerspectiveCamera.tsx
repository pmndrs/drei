import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import * as React from 'react'
import { useThree, useUpdate } from 'react-three-fiber'
import mergeRefs from 'react-merge-refs'

type Props = JSX.IntrinsicElements['perspectiveCamera'] & {
  makeDefault?: boolean
}

export const PerspectiveCamera = React.forwardRef(({ makeDefault = false, ...props }: Props, ref) => {
  const { setDefaultCamera, camera, size } = useThree()
  const cameraRef = useUpdate<PerspectiveCameraImpl>(
    (cam) => {
      cam.aspect = size.width / size.height
      cam.updateProjectionMatrix()
    },
    [size, props]
  )

  React.useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      setDefaultCamera(cameraRef.current)
      return () => setDefaultCamera(oldCam)
    }
  }, [camera, cameraRef, makeDefault, setDefaultCamera])

  return <perspectiveCamera ref={mergeRefs([cameraRef, ref])} {...props} />
})
