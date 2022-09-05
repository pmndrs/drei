import * as React from 'react'
import { BoxHelper, CameraHelper } from 'three'
import { VertexNormalsHelper } from 'three-stdlib'

import { Setup } from '../Setup'

import { Sphere, useHelper, PerspectiveCamera } from '../../src'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default {
  title: 'Gizmos/useHelper',
  component: useHelper,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
  args: {
    showHelper: true,
  },
  argTypes: {
    showHelper: {
      type: 'boolean',
    },
  },
}

type StoryProps = {
  showHelper: boolean
}

const Scene: React.FC<StoryProps> = ({ showHelper }) => {
  const mesh = React.useRef()
  useHelper(showHelper && mesh, BoxHelper, 'royalblue')
  useHelper(showHelper && mesh, VertexNormalsHelper, 1, 0xff0000)

  return (
    <Sphere ref={mesh}>
      <meshBasicMaterial />
    </Sphere>
  )
}

export const DefaultStory = (args: StoryProps) => <Scene {...args} />
DefaultStory.storyName = 'Default'

const CameraScene: React.FC<StoryProps> = ({ showHelper }) => {
  const camera = React.useRef<THREE.PerspectiveCamera>()
  useHelper(showHelper && camera, CameraHelper)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (camera.current) {
      camera.current.lookAt(0, 0, 0)

      camera.current.position.x = Math.sin(t) * 4
      camera.current.position.z = Math.cos(t) * 4
    }
  })

  return (
    <PerspectiveCamera makeDefault={false} position={[0, 3, 3]} near={1} far={4} ref={camera}>
      <meshBasicMaterial />
    </PerspectiveCamera>
  )
}

export const CameraStory = (args: StoryProps) => <CameraScene {...args} />
CameraStory.storyName = 'Camera Helper'
