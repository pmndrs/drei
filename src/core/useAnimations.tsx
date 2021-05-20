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
  root?: React.MutableRefObject<Object3D | undefined | null>
): Api<T> {
  const ref = React.useRef<Object3D>()
  const actualRef = root ? root : ref
  const [mixer] = React.useState(() => new AnimationMixer(undefined as unknown as Object3D))
  const [clipActions] = React.useState(() => ({}))
  const [api] = React.useState<Api<T>>(() => {
    let actions = {} as { [key in T['name']]: AnimationAction | null }
    clips.forEach((clip) =>
      Object.defineProperty(actions, clip.name, {
        enumerable: true,
        get() {
          if (actualRef.current) {
            return clipActions[clip.name] || (clipActions[clip.name] = mixer.clipAction(clip, actualRef.current))
          }
        },
      })
    )
    return { ref: actualRef, clips, actions, names: clips.map((c) => c.name), mixer }
  })
  useFrame((state, delta) => mixer.update(delta))
  React.useEffect(() => {
    const currentRoot = actualRef.current
    return () =>
      Object.values(api.actions).forEach((action) => {
        if (currentRoot) {
          mixer.uncacheAction(action as AnimationClip, currentRoot)
        }
      })
  }, [api, mixer, actualRef])
  return api
}
