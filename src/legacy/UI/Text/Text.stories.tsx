import * as React from 'react'
import { DoubleSide, Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { useTurntable } from '@sb/useTurntable'

import { Text as LegacyText } from './Text'

export default {
  title: 'UI/Text',
  tags: ['legacyOnly'],
  component: LegacyText,
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        limitedTo="legacy"
        controls={false}
        cameraPosition={new Vector3(0, 0, 200)}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof LegacyText>

type Story = StoryObj<typeof LegacyText>

const LOREM_TEXT =
  'LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR. EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.'

//

function TextScene(props: React.ComponentProps<typeof LegacyText>) {
  const ref = useTurntable()

  return (
    <LegacyText ref={ref} {...props}>
      {LOREM_TEXT}
    </LegacyText>
  )
}

export const TextSt = {
  args: {
    color: '#EC2D2D',
    fontSize: 12,
    maxWidth: 200,
    lineHeight: 1,
    letterSpacing: 0.02,
    textAlign: 'left',
    font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
    anchorX: 'center',
    anchorY: 'middle',
  },
  render: (args) => <TextScene {...args} />,
  name: 'Default',
} satisfies Story

//

function TextOutlineScene(props: React.ComponentProps<typeof LegacyText>) {
  const ref = useTurntable()

  return (
    <LegacyText ref={ref} {...props}>
      {LOREM_TEXT}
    </LegacyText>
  )
}

export const TextOutlineSt = {
  args: {
    color: '#EC2D2D',
    fontSize: 12,
    maxWidth: 200,
    lineHeight: 1,
    letterSpacing: 0.02,
    textAlign: 'left',
    font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
    anchorX: 'center',
    anchorY: 'middle',
    outlineWidth: 2,
    outlineColor: '#ffffff',
  },
  render: (args) => <TextOutlineScene {...args} />,
  name: 'Outline',
} satisfies Story

//

function TextStrokeScene(props: React.ComponentProps<typeof LegacyText>) {
  const ref = useTurntable()

  return (
    <LegacyText ref={ref} {...props}>
      {LOREM_TEXT}
    </LegacyText>
  )
}

export const TextStrokeSt = {
  args: {
    fontSize: 12,
    maxWidth: 200,
    lineHeight: 1,
    letterSpacing: 0.02,
    textAlign: 'left',
    font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
    anchorX: 'center',
    anchorY: 'middle',
    fillOpacity: 0,
    strokeWidth: '2.5%',
    strokeColor: '#ffffff',
  },
  render: (args) => <TextStrokeScene {...args} />,
  name: 'Transparent with stroke',
} satisfies Story

//

function TextShadowScene(props: React.ComponentProps<typeof LegacyText>) {
  const ref = useTurntable()

  return (
    <LegacyText ref={ref} {...props}>
      {LOREM_TEXT}
    </LegacyText>
  )
}

export const TextShadowSt = {
  args: {
    color: '#EC2D2D',
    fontSize: 12,
    maxWidth: 200,
    lineHeight: 1,
    letterSpacing: 0.02,
    textAlign: 'left',
    font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
    anchorX: 'center',
    anchorY: 'middle',
    outlineOffsetX: '10%',
    outlineOffsetY: '10%',
    outlineBlur: '30%',
    outlineOpacity: 0.3,
    outlineColor: '#EC2D2D',
  },
  render: (args) => <TextShadowScene {...args} />,
  name: 'Text Shadow',
} satisfies Story

//

function TextRtlScene(props: React.ComponentProps<typeof LegacyText>) {
  const ref = useTurntable()

  const rtlText =
    'إن عدة الشهور عند الله اثنا عشر شهرا في كتاب الله يوم خلق السماوات والارض SOME LATIN TEXT HERE منها أربعة حرم ذلك الدين القيم فلا تظلموا فيهن أنفسكم وقاتلوا المشركين كافة كما يقاتلونكم كافة واعلموا أن الله مع المتقين'

  return (
    <LegacyText ref={ref} {...props}>
      {rtlText}
    </LegacyText>
  )
}

export const TextRtl = {
  args: {
    color: '#EC2D2D',
    fontSize: 12,
    maxWidth: 200,
    lineHeight: 1,
    letterSpacing: 0.02,
    textAlign: 'right',
    direction: 'auto',
    font: 'https://fonts.gstatic.com/s/scheherazade/v20/YA9Ur0yF4ETZN60keViq1kQgtA.woff',
    anchorX: 'center',
    anchorY: 'middle',
  },
  render: (args) => <TextRtlScene {...args} />,
  name: 'Text Rtl',
} satisfies Story

//

function CustomMaterialTextScene({ color, opacity }: { color: string; opacity: number }) {
  const ref = useTurntable()

  const textProps = {
    fontSize: 12,
    maxWidth: 200,
    lineHeight: 1,
    letterSpacing: 0.02,
    textAlign: 'left' as const,
    font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
  }

  return (
    <LegacyText ref={ref} {...textProps}>
      <meshBasicMaterial side={DoubleSide} color={color} transparent opacity={opacity} />
      {LOREM_TEXT}
    </LegacyText>
  )
}

export const CustomMaterialTextSt = {
  args: {
    color: '#EC2D2D',
    opacity: 1,
  },
  argTypes: {
    color: { control: 'color' },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  },
  render: (args) => <CustomMaterialTextScene {...args} />,
  name: 'Custom Material',
} satisfies StoryObj<React.ComponentProps<typeof CustomMaterialTextScene>>
