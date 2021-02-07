import * as React from 'react'
import { DoubleSide, Vector3 } from 'three'
import { number, color as colorKnob } from '@storybook/addon-knobs'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Text } from '../../src'

export default {
  title: 'Abstractions/Text',
  component: Text,
  argTypes: {
    color: {
      control: {
        type: 'color',
      },
    },
    opacity: {
      control: {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.1,
      },
    },
    fontSize: {
      control: {
        type: 'number',
      },
    },
    maxWidth: {
      control: {
        type: 'number',
      },
    },
    textAlign: {
      control: {
        type: 'select',
        options: ['left', 'center', 'right', 'justify'],
      },
    },
    anchorX: {
      control: {
        type: 'select',
        options: ['left', 'center', 'right'],
      },
    },
    anchorY: {
      control: {
        type: 'select',
        options: ['top', 'top-baseline', 'middle', 'bottom-baseline', 'bottom'],
      },
    },
    letterSpacing: {
      control: {
        type: 'number',
        step: 0.01,
      },
    },
    lineHeight: {
      control: {
        type: 'number',
        step: 0.1,
      },
    },
    outlineColor: {
      control: {
        type: 'color',
      },
    },
    outlineWidth: {
      control: {
        type: 'number',
        min: 0,
        step: 0.2,
      },
    },
    fillOpacity: {
      control: {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.1,
      },
    },
    strokeWidth: {
      control: {
        type: 'number',
        min: 0,
        step: 0.1,
      },
    },
    strokeColor: {
      control: {
        type: 'color',
      },
    },
    outlineOffsetX: {
      control: {
        type: 'range',
        min: 0,
        max: 10,
        step: 1,
      },
    },
    outlineOffsetY: {
      control: {
        type: 'range',
        min: 0,
        max: 10,
        step: 1,
      },
    },
    outlineBlur: {
      control: {
        type: 'range',
        min: 0,
        max: 10,
        step: 1,
      },
    },
    outlineOpacity: {
      control: {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.1,
      },
    },
  },
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 200)}>{storyFn()}</Setup>],
}

function TextScene({ cfg }) {
  const ref = useTurntable()

  return (
    <Text
      ref={ref}
      color={cfg.color}
      fontSize={cfg.fontSize}
      maxWidth={cfg.maxWidth}
      lineHeight={cfg.lineHeight}
      letterSpacing={cfg.letterSpacing}
      textAlign={cfg.textAlign}
      font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      anchorX={cfg.anchorX}
      anchorY={cfg.anchorY}
    >
      LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
      MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
      CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
      EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.
    </Text>
  )
}

const textControlsConfig = {
  color: '#ec2d2d',
  fontSize: 12,
  maxWidth: 200,
  lineHeight: 1,
  letterSpacing: 0.02,
  textAlign: 'left',
  anchorX: 'center',
  anchorY: 'middle',
}

export const TextSt = ({ ...args }) => <TextScene cfg={args} />
TextSt.storyName = 'Default'
TextSt.args = { ...textControlsConfig }

function TextOutlineScene({ cfg }) {
  const ref = useTurntable()

  return (
    <Text
      ref={ref}
      color={cfg.color}
      fontSize={cfg.fontSize}
      maxWidth={cfg.maxWidth}
      lineHeight={cfg.lineHeight}
      letterSpacing={cfg.letterSpacing}
      textAlign={cfg.textAlign}
      font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      anchorX={cfg.anchorX}
      anchorY={cfg.anchorY}
      outlineWidth={cfg.outlineWidth}
      outlineColor={cfg.outlineColor}
    >
      LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
      MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
      CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
      EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.
    </Text>
  )
}

const textOutlineControlsConfig = {
  color: '#ec2d2d',
  fontSize: 12,
  maxWidth: 200,
  lineHeight: 1,
  letterSpacing: 0.02,
  textAlign: 'left',
  anchorX: 'center',
  anchorY: 'middle',
  outlineWidth: 2,
  outlineColor: 'white',
}

export const TextOutlineSt = ({ ...args }) => <TextOutlineScene cfg={args} />
TextOutlineSt.storyName = 'Outline'
TextOutlineSt.args = { ...textOutlineControlsConfig }

function TextStrokeScene({ cfg }) {
  const ref = useTurntable()

  return (
    <Text
      ref={ref}
      fontSize={cfg.fontSize}
      maxWidth={cfg.maxWidth}
      lineHeight={cfg.lineHeight}
      letterSpacing={cfg.letterSpacing}
      textAlign={cfg.textAlign}
      font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      anchorX={cfg.anchorX}
      anchorY={cfg.anchorY}
      fillOpacity={cfg.fillOpacity}
      strokeWidth={cfg.strokeWidth}
      strokeColor={cfg.strokeColor}
    >
      LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
      MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
      CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
      EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.
    </Text>
  )
}

const textStrokeControlsConfig = {
  fontSize: 12,
  maxWidth: 200,
  lineHeight: 1,
  letterSpacing: 0.02,
  textAlign: 'left',
  anchorX: 'center',
  anchorY: 'middle',
  fillOpacity: 0,
  strokeWidth: 0.25,
  strokeColor: 'white',
}

export const TextStrokeSt = ({ ...args }) => <TextStrokeScene cfg={args} />
TextStrokeSt.storyName = 'Transparent with stroke'
TextStrokeSt.args = { ...textStrokeControlsConfig }

function TextShadowScene({ cfg }) {
  const ref = useTurntable()

  return (
    <Text
      ref={ref}
      color={cfg.color}
      fontSize={cfg.fontSize}
      maxWidth={cfg.maxWidth}
      lineHeight={cfg.lineHeight}
      letterSpacing={cfg.letterSpacing}
      textAlign={cfg.textAlign}
      font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      anchorX={cfg.anchorX}
      anchorY={cfg.anchorY}
      outlineOffsetX={cfg.outlineOffsetX}
      outlineOffsetY={cfg.outlineOffsetY}
      outlineBlur={cfg.outlineBlur}
      outlineOpacity={cfg.outlineOpacity}
      outlineColor={cfg.outlineColor}
    >
      LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
      MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
      CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
      EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.
    </Text>
  )
}

const textShadowControlsConfig = {
  color: '#ec2d2d',
  fontSize: 12,
  maxWidth: 200,
  lineHeight: 1,
  letterSpacing: 0.02,
  textAlign: 'left',
  anchorX: 'center',
  anchorY: 'middle',
  outlineOffsetX: 1,
  outlineOffsetY: 1,
  outlineBlur: 3,
  outlineOpacity: 0.3,
  outlineColor: '#EC2D2D',
}

export const TextShadowSt = ({ ...args }) => <TextShadowScene cfg={args} />
TextShadowSt.storyName = 'Text Shadow'
TextShadowSt.args = { ...textShadowControlsConfig }

function CustomMaterialTextScene({ cfg }) {
  const ref = useTurntable()
  // const defaultColor = '#EC2D2D'

  return (
    <Text
      ref={ref}
      fontSize={cfg.fontSize}
      maxWidth={cfg.maxWidth}
      lineHeight={cfg.lineHeight}
      letterSpacing={cfg.letterSpacing}
      textAlign={cfg.textAlign}
      font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      anchorX={cfg.anchorX}
      anchorY={cfg.anchorY}
    >
      <meshBasicMaterial attach="material" side={DoubleSide} color={cfg.color} transparent opacity={cfg.opacity} />
      LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
      MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
      CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
      EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.
    </Text>
  )
}

const customMaterialTextControlsConfig = {
  color: '#ec2d2d',
  fontSize: 12,
  maxWidth: 200,
  lineHeight: 1,
  letterSpacing: 0.02,
  textAlign: 'left',
  anchorX: 'center',
  anchorY: 'middle',
  opacity: 1,
}

export const CustomMaterialTextSt = ({ ...args }) => <CustomMaterialTextScene cfg={args} />
CustomMaterialTextSt.storyName = 'Custom Material'
CustomMaterialTextSt.args = { ...customMaterialTextControlsConfig }
