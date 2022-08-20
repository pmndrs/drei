import { RootState } from '@react-three/fiber'

type EventOptions = {
  target?: HTMLElement
  priority?: number
  prefix?: 'offset' | 'client' | 'page' | 'layer' | 'screen'
}

export function configureEvents(_options: EventOptions) {
  const options = {
    prefix: 'offset',
    ..._options,
  }
  return (state: RootState) => {
    // Bind events to the parent so that both the dom and webgl can have events
    if (options.target) state.events.connect?.(options.target)
    // Set up compute function
    if (options.prefix !== 'offset')
      state.setEvents({
        compute: (event, state) => {
          state.pointer.set(
            (event[options.prefix + 'X'] / state.size.width) * 2 - 1,
            -(event[options.prefix + 'Y'] / state.size.height) * 2 + 1
          )
          state.raycaster.setFromCamera(state.pointer, state.camera)
        },
      })
  }
}
