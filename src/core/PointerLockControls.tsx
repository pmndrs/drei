import * as React from 'react'
import { ReactThreeFiber, useThree, Overwrite } from 'react-three-fiber'
import { PointerLockControls as PointerLockControlsImpl } from 'three/examples/jsm/controls/PointerLockControls'
import useEffectfulState from '../helpers/useEffectfulState'

export type PointerLockControls = Overwrite<
  ReactThreeFiber.Object3DNode<PointerLockControlsImpl, typeof PointerLockControlsImpl>,
  { selector?: string }
>

export const PointerLockControls = React.forwardRef((props: PointerLockControls, ref) => {
  const { camera, gl, invalidate } = useThree()
  const controls = useEffectfulState(
    () => new PointerLockControlsImpl(camera, gl.domElement),
    [camera, gl.domElement],
    ref as any
  )

  // Only props that are not 'selector' are passed down to the primitive
  // 'selector' is used here and other props are used on Three.js' side
  const internalProps = (({ selector: _, ...rest }) => rest)(props)

  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  React.useEffect(() => {
    const handler = () => controls?.lock()
    const selector = props.selector
    const element = selector ? document.querySelector(selector) : document
    element && element.addEventListener('click', handler)
    return () => (element ? element.removeEventListener('click', handler) : undefined)
  }, [controls, props.selector])

  return controls ? <primitive dispose={undefined} object={controls} {...internalProps} /> : null
})
