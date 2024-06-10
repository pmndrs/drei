import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { Stage, Sphere } from '../../src'
import { presetsObj, PresetsType } from '../../src/helpers/environment-assets'

const environments = Object.keys(presetsObj)

export default {
  title: 'Staging/Stage',
  component: Stage,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

enum presets {
  rembrant = 'rembrandt',
  portrait = 'portrait',
  upfront = 'upfront',
  soft = 'soft',
}

function StageStory(args) {
  return (
    <React.Suspense fallback={null}>
      <color attach="background" args={['white']} />
      <Stage {...args}>
        <Sphere args={[1, 64, 64]}>
          <meshStandardMaterial roughness={0} color="royalblue" />
        </Sphere>
      </Stage>
    </React.Suspense>
  )
}

export const StageSt = (args) => <StageStory {...args} />
StageSt.story = {
  name: 'Default',
}
StageSt.args = {
  intensity: 1,
  environment: environments[0],
  preset: 'rembrandt',
}
StageSt.argTypes = {
  environment: { control: 'select', options: environments },
  preset: { control: 'select', options: presets },
}
