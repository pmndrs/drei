import { useFrame } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { BoxHelper, CameraHelper } from 'three'
import { VertexNormalsHelper } from 'three-stdlib'
import { Helper, PerspectiveCamera, Sphere } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Gizmos/Helper',
  component: Helper,
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
  return (
    <Sphere>
      <meshBasicMaterial />

      {showHelper && (
        <>
          <Helper type={BoxHelper} args={['royalblue']} />
          <Helper type={VertexNormalsHelper} args={[1, 0xff0000]} />
        </>
      )}
    </Sphere>
  )
}

export const DefaultStory = (args: StoryProps) => <Scene {...args} />
DefaultStory.storyName = 'Default'

const CameraScene: React.FC<StoryProps> = ({ showHelper }) => {
  const camera = React.useRef<THREE.PerspectiveCamera>()

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

      {showHelper && <Helper type={CameraHelper} />}
    </PerspectiveCamera>
  )
}

export const CameraStory = (args: StoryProps) => <CameraScene {...args} />
CameraStory.storyName = 'Camera Helper'
