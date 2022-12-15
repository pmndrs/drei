import * as React from 'react'
import { Object3D, AnimationClip, AnimationAction, AnimationMixer } from 'three'
import { useFrame } from '@react-three/fiber'

type Api<T extends AnimationClip> = {
  ref: React.MutableRefObject<Object3D | undefined | null>
  clips: AnimationClip[]
  mixer: AnimationMixer
  names: T['name'][]
  actions: { [key in T['name']]: AnimationAction | null }
}

export function useAnimations<T extends AnimationClip>(
  clips: T[],
  root?: React.MutableRefObject<Object3D | undefined | null> | Object3D
): Api<T> {
  const ref = React.useRef<Object3D>()
  const [actualRef] = React.useState(() => (root ? (root instanceof Object3D ? { current: root } : root) : ref))
  // eslint-disable-next-line prettier/prettier
  const [mixer] = React.useState(() => new AnimationMixer(undefined as unknown as Object3D))
  const lazyActions = React.useRef({})
  const [api] = React.useState<Api<T>>(() => {
    const actions = {} as { [key in T['name']]: AnimationAction | null }
    clips.forEach((clip) =>
      Object.defineProperty(actions, clip.name, {
        enumerable: true,
        get() {
          if (actualRef.current) {
            return (
              lazyActions.current[clip.name] ||
              (lazyActions.current[clip.name] = mixer.clipAction(clip, actualRef.current))
            )
          }
        },
      })
    )
    return { ref: actualRef, clips, actions, names: clips.map((c) => c.name), mixer }
  })
  useFrame((state, delta) => mixer.update(delta))
  React.useEffect(() => {
    const currentRoot = actualRef.current
    return () => {
      // Clean up only when clips change, wipe out lazy actions and uncache clips
      lazyActions.current = {}
      Object.values(api.actions).forEach((action) => {
        if (currentRoot) {
          mixer.uncacheAction(action as AnimationClip, currentRoot)
        }
      })
    }
  }, [clips])

  React.useEffect(() => {
    return () => {
      mixer.stopAllAction()
    }
  }, [mixer])

  return api
}
