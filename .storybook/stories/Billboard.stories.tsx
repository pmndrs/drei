import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Billboard, OrbitControls } from '../../src'

export default {
  title: 'Abstractions/Billboard',
  component: Billboard,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function BillboardStory({ cfg }) {
  return (
    <>
      <Billboard
        position={[-4, -2, 0]}
        args={[3, 2]}
        material-color="red"
        follow={cfg.follow}
        lockX={cfg.lockX}
        lockY={cfg.lockY}
        lockZ={cfg.lockZ}
      />
      <Billboard
        position={[-4, 2, 0]}
        args={[3, 2]}
        material-color="orange"
        follow={cfg.follow}
        lockX={cfg.lockX}
        lockY={cfg.lockY}
        lockZ={cfg.lockZ}
      />
      <Billboard
        position={[0, 0, 0]}
        args={[3, 2]}
        material-color="green"
        follow={cfg.follow}
        lockX={cfg.lockX}
        lockY={cfg.lockY}
        lockZ={cfg.lockZ}
      />
      <Billboard
        position={[4, -2, 0]}
        args={[3, 2]}
        material-color="blue"
        follow={cfg.follow}
        lockX={cfg.lockX}
        lockY={cfg.lockY}
        lockZ={cfg.lockZ}
      />
      <Billboard
        position={[4, 2, 0]}
        args={[3, 2]}
        material-color="yellow"
        follow={cfg.follow}
        lockX={cfg.lockX}
        lockY={cfg.lockY}
        lockZ={cfg.lockZ}
      />

      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

const controlsConfig = {
  follow: true,
  lockX: false,
  lockY: false,
  lockZ: false,
}

export const BillboardSt = ({ ...args }) => <BillboardStory cfg={args} />
BillboardSt.storyName = 'Default'
BillboardSt.args = { ...controlsConfig }
