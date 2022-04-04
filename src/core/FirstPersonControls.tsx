import * as React from 'react'
import { EventManager, Object3DNode, useFrame, useThree } from '@react-three/fiber'
import { FirstPersonControls as FirstPersonControlImpl } from 'three-stdlib'

export type FirstPersonControlsProps = Object3DNode<FirstPersonControlImpl, typeof FirstPersonControlImpl> & {
  domElement?: HTMLElement
}

export const FirstPersonControls = React.forwardRef<FirstPersonControlImpl, FirstPersonControlsProps>(
  ({ domElement, ...props }, ref) => {
    const camera = useThree((state) => state.camera)
    const gl = useThree((state) => state.gl)
    const events = useThree((state) => state.events) as EventManager<HTMLElement>
    const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
    const [controls] = React.useState(() => new FirstPersonControlImpl(camera, explDomElement))

    useFrame((_, delta) => {
      controls.update(delta)
    }, -1)

    return controls ? <primitive ref={ref} object={controls} {...props} /> : null
  }
)
