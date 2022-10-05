import * as React from 'react'
import { EventManager, Object3DNode, useFrame, useThree } from '@react-three/fiber'
import { FirstPersonControls as FirstPersonControlImpl } from 'three-stdlib'

export type FirstPersonControlsProps = Object3DNode<FirstPersonControlImpl, typeof FirstPersonControlImpl> & {
  domElement?: HTMLElement
  makeDefault?: boolean
}

export const FirstPersonControls = React.forwardRef<FirstPersonControlImpl, FirstPersonControlsProps>(
  ({ domElement, makeDefault, ...props }, ref) => {
    const camera = useThree((state) => state.camera)
    const gl = useThree((state) => state.gl)
    const events = useThree((state) => state.events) as EventManager<HTMLElement>
    const get = useThree((state) => state.get)
    const set = useThree((state) => state.set)
    const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
    const [controls] = React.useState(() => new FirstPersonControlImpl(camera, explDomElement))

    React.useEffect(() => {
      if (makeDefault) {
        const old = get().controls
        set({ controls })
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    useFrame((_, delta) => {
      controls.update(delta)
    }, -1)

    return controls ? <primitive ref={ref} object={controls} {...props} /> : null
  }
)
