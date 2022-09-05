import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { Icosahedron, Sphere, Html, BBAnchor, OrbitControls, useHelper } from '../../src'
import { BoxHelper } from 'three'

export default {
  title: 'Staging/BBAnchor',
  component: BBAnchor,
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
    anchorX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    anchorY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    anchorZ: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    children: { table: { disable: true } },
  },
}

type Anchor = THREE.Vector3 | [number, number, number]

function BBAnchorScene({
  anchor,
  drawBoundingBox,
  children,
}: {
  anchor: Anchor
  drawBoundingBox: boolean
  children?: React.ReactChild
}) {
  const ref = React.useRef()

  useHelper(drawBoundingBox && ref, BoxHelper, 'cyan')

  return (
    <>
      <OrbitControls autoRotate />
      <Icosahedron ref={ref}>
        <meshBasicMaterial color="hotpink" wireframe />
        <BBAnchor anchor={anchor}>{children}</BBAnchor>
      </Icosahedron>
    </>
  )
}

const Template = ({ drawBoundingBox, anchorX, anchorY, anchorZ, ...args }) => (
  <BBAnchorScene drawBoundingBox={drawBoundingBox} anchor={[anchorX, anchorY, anchorZ]} {...args} />
)

function HtmlComp() {
  return (
    <Html
      style={{
        color: 'white',
        whiteSpace: 'nowrap',
      }}
      center
    >
      Html element
    </Html>
  )
}

export const BBAnchorWithHtml = Template.bind({})
BBAnchorWithHtml.args = {
  drawBoundingBox: true,
  anchorX: 1,
  anchorY: 1,
  anchorZ: 1,
  children: <HtmlComp />,
}
BBAnchorWithHtml.storyName = 'With Html component'

function MeshComp() {
  return (
    <Sphere args={[0.25]}>
      <meshBasicMaterial color="lime" />
    </Sphere>
  )
}

export const BBAnchorWithMesh = Template.bind({})
BBAnchorWithMesh.args = {
  drawBoundingBox: true,
  anchorX: 1,
  anchorY: 1,
  anchorZ: 1,
  children: <MeshComp />,
}
BBAnchorWithMesh.storyName = 'With other mesh'
