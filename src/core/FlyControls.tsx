import { EventManager, ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { FlyControls as FlyControlsImpl } from 'three-stdlib'

export type FlyControlsProps = ReactThreeFiber.Object3DNode<FlyControlsImpl, typeof FlyControlsImpl> & {
  onChange?: (e?: THREE.Event) => void
  domElement?: HTMLElement
  makeDefault?: boolean
}

export const FlyControls = React.forwardRef<FlyControlsImpl, FlyControlsProps>(({ domElement, ...props }, fref) => {
  const { onChange, makeDefault, ...rest } = props
  const invalidate = useThree((state) => state.invalidate)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const events = useThree((state) => state.events) as EventManager<HTMLElement>
  const get = useThree((state) => state.get)
  const set = useThree((state) => state.set)
  const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
  const controls = React.useMemo(() => new FlyControlsImpl(camera), [camera])

  React.useEffect(() => {
    controls.connect(explDomElement)
    return () => void controls.dispose()
  }, [explDomElement, controls, invalidate])

  React.useEffect(() => {
    const callback = (e: THREE.Event) => {
      invalidate()
      if (onChange) onChange(e)
    }

    controls.addEventListener?.('change', callback)
    return () => controls.removeEventListener?.('change', callback)
  }, [onChange, invalidate])

  React.useEffect(() => {
    if (makeDefault) {
      const old = get().controls
      set({ controls })
      return () => set({ controls: old })
    }
  }, [makeDefault, controls])

  useFrame((_, delta) => controls.update(delta))
  return <primitive ref={fref} object={controls} args={[camera, explDomElement]} {...rest} />
})
