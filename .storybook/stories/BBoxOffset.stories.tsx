import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { Icosahedron, Html, BBoxOffset, OrbitControls, useHelper } from '../../src'
import { BoxHelper } from 'three'

export default {
  title: 'Misc/BBoxOffset',
  component: BBoxOffset,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new THREE.Vector3(2, 2, 2)} controls={false}>
        {' '}
        {storyFn()}
      </Setup>
    ),
  ],
  argTypes: {
    drawBoundingBox: { control: 'boolean' },
    anchorX: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
    anchorY: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
    anchorZ: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
  },
}

type Anchor = THREE.Vector3 | [number, number, number]

function BBoxOffsetScene({ anchor, drawBoundingBox }: { anchor: Anchor; drawBoundingBox: boolean }) {
  const ref = React.useRef()

  useHelper(drawBoundingBox && ref, BoxHelper, 'cyan')

  return (
    <>
      <OrbitControls autoRotate />
      <Icosahedron ref={ref}>
        <meshBasicMaterial color="hotpink" wireframe />
        <BBoxOffset anchor={anchor}>
          <Html
            style={{
              color: 'white',
              whiteSpace: 'nowrap',
            }}
            center
          >
            Html element
          </Html>
        </BBoxOffset>
      </Icosahedron>
    </>
  )
}

const Template = ({ drawBoundingBox, anchorX, anchorY, anchorZ, ...args }) => (
  <BBoxOffsetScene drawBoundingBox={drawBoundingBox} anchor={[anchorX, anchorY, anchorZ]} {...args} />
)

export const BBoxOffsetWithHtml = Template.bind({})
BBoxOffsetWithHtml.args = {
  drawBoundingBox: true,
  anchorX: 0.5,
  anchorY: 0.5,
  anchorZ: 0.5,
}
BBoxOffsetWithHtml.storyName = 'With Html component'
