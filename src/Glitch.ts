import { useMemo, useEffect } from 'react'
import { useFrame, useThree } from 'react-three-fiber'

import {
  GlitchEffect,
  RenderPass,
  EffectComposer,
  EffectPass,
  NormalPass,
  // @ts-ignore
} from 'postprocessing'
import { HalfFloatType, Vector2 } from 'three'

type GlitchEffectProps = {
  active?: boolean
  ratio?: number
  duration?: Vector2
  delay?: Vector2
  chromaticAberrationOffset?: Vector2
}

const Glitch = (glitchEffectProps: GlitchEffectProps) => {
  const { gl, scene, camera, size } = useThree()

  const composer = useMemo(() => {
    const effectComposer = new EffectComposer(gl, {
      frameBufferType: HalfFloatType,
    })
    effectComposer.addPass(new RenderPass(scene, camera))

    const normalPass = new NormalPass(scene, camera)

    effectComposer.addPass(normalPass)

    const glitchEffect = new GlitchEffect(glitchEffectProps)

    const glitchPass = new EffectPass(camera, glitchEffect)

    glitchPass.renderToScreen = true

    effectComposer.addPass(glitchPass)

    return effectComposer
  }, [camera, gl, scene, glitchEffectProps])

  useEffect(() => composer.setSize(size.width, size.height), [composer, size])
  return useFrame((_, delta) => composer.render(delta), 1)
}

export default Glitch
