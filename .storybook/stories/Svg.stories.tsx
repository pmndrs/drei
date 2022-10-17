import { useEffect } from '@storybook/addons'
import { useArgs } from '@storybook/client-api'
import { ComponentMeta } from '@storybook/react'
import * as React from 'react'
import { ComponentProps, FC, Suspense } from 'react'
import { MathUtils, NoToneMapping, Vector3 } from 'three'
import { Svg, SvgProps } from '../../src'
import { Setup } from '../Setup'

const svgRecord = {
  Tiger: 'models/svg/tiger.svg',
  'Three.js': 'models/svg/threejs.svg',
  'Joins and caps': 'models/svg/lineJoinsAndCaps.svg',
  Hexagon: 'models/svg/hexagon.svg',
  Energy: 'models/svg/energy.svg',
  'Test 1': 'models/svg/tests/1.svg',
  'Test 2': 'models/svg/tests/2.svg',
  'Test 3': 'models/svg/tests/3.svg',
  'Test 4': 'models/svg/tests/4.svg',
  'Test 5': 'models/svg/tests/5.svg',
  'Test 6': 'models/svg/tests/6.svg',
  'Test 7': 'models/svg/tests/7.svg',
  'Test 8': 'models/svg/tests/8.svg',
  'Test 9': 'models/svg/tests/9.svg',
  Units: 'models/svg/tests/units.svg',
  Ordering: 'models/svg/tests/ordering.svg',
  Defs: 'models/svg/tests/testDefs/Svg-defs.svg',
  Defs2: 'models/svg/tests/testDefs/Svg-defs2.svg',
  Defs3: 'models/svg/tests/testDefs/Wave-defs.svg',
  Defs4: 'models/svg/tests/testDefs/defs4.svg',
  Defs5: 'models/svg/tests/testDefs/defs5.svg',
  'Style CSS inside defs': 'models/svg/style-css-inside-defs.svg',
  'Multiple CSS classes': 'models/svg/multiple-css-classes.svg',
  'Zero Radius': 'models/svg/zero-radius.svg',
  'Styles in svg tag': 'models/svg/tests/styles.svg',
  'Round join': 'models/svg/tests/roundJoinPrecisionIssue.svg',
}

const url = 'https://threejs.org/examples'

interface SvgStoryProps extends SvgProps {
  svg: string
  fillWireframe: boolean
  strokesWireframe: boolean
}

const args: SvgStoryProps = {
  src: `${url}/${svgRecord.Tiger}`,
  svg: svgRecord.Tiger,
  skipFill: false,
  skipStrokes: false,
  fillWireframe: false,
  strokesWireframe: false,
}

export default {
  title: 'Abstractions/Svg',
  component: Svg,
  decorators: [
    (storyFn) => (
      <Setup
        gl={{ toneMapping: NoToneMapping }}
        onCreated={(st) => st.gl.setClearColor('#ccc')}
        cameraPosition={new Vector3(0, 0, 200)}
        lights={false}
      >
        {storyFn()}
      </Setup>
    ),
  ],
  args,
  argTypes: {
    svg: {
      options: svgRecord,
      control: {
        type: 'select',
      },
    },
  },
}

export const SvgSt: FC<SvgStoryProps> = ({ svg, fillWireframe, strokesWireframe, ...props }) => {
  const [_, updateArgs] = useArgs()
  useEffect(() => {
    updateArgs({ src: `${url}/${svg || svgRecord.Tiger}` })
  }, [svg])
  return (
    <Suspense fallback={null}>
      <Svg
        {...props}
        position={[-70, 70, 0]}
        scale={0.25}
        fillMaterial={{ wireframe: fillWireframe }}
        strokeMaterial={{ wireframe: strokesWireframe }}
      />
      <gridHelper args={[160, 10]} rotation={[MathUtils.DEG2RAD * 90, 0, 0]} />
    </Suspense>
  )
}
