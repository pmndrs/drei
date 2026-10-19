import * as React from 'react'
import { EventManager, ThreeElement } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber/extension'
import { FirstPersonControls as FirstPersonControlImpl } from 'three/examples/jsm/controls/FirstPersonControls.js'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export type FirstPersonControlsProps = Omit<ThreeElement<typeof FirstPersonControlImpl>, 'ref' | 'args'> & {
  domElement?: HTMLElement
  makeDefault?: boolean
}

/**
 * First-person camera controls.
 * Wraps THREE's [FirstPersonControls](https://threejs.org/docs/#examples/en/controls/FirstPersonControls).
 *
 * @example Basic usage
 * ```jsx
 * <FirstPersonControls />
 * ```
 */
export const FirstPersonControls: ForwardRefComponent<FirstPersonControlsProps, FirstPersonControlImpl> =
  /* @__PURE__ */ React.forwardRef<FirstPersonControlImpl, FirstPersonControlsProps>(
    ({ domElement, makeDefault, ...props }, ref) => {
      const camera = useThree((state) => state.camera)
      const renderer = useThree((state) => state.renderer)
      const events = useThree((state) => state.events) as EventManager<HTMLElement>
      const get = useThree((state) => state.get)
      const set = useThree((state) => state.set)
      const explDomElement = (domElement || events.connected || renderer.domElement) as HTMLElement
      const [controls] = React.useState(() => new FirstPersonControlImpl(camera, explDomElement))

      React.useEffect(() => {
        if (makeDefault) {
          const old = get().controls
          set({ controls })
          return () => set({ controls: old })
        }
      }, [makeDefault, controls])

      useFrame(
        (_, delta) => {
          controls.update(delta)
        },
        { before: 'update' }
      )

      return controls ? <primitive ref={ref} object={controls} {...props} /> : null
    }
  )
