/* eslint react-hooks/exhaustive-deps: 1 */
import * as THREE from 'three'
import * as React from 'react'
import { ComponentProps, ComponentRef, ReactNode, useEffect, useRef, useState } from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'
import { ThreeEvent, useThree } from '@react-three/fiber'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'

import { Setup } from '../Setup'

import {
  FaceControls,
  FaceLandmarker,
  FaceTracking,
  FacemeshDatas,
  GazeCalibration,
  GazePointer,
  GazePointerDefaults,
  GazePointerDwellEvent,
  gazeClientToScreen,
  getGazeViewport,
} from '../../src'
import { getGazeScreen } from '../../src/web/GazePointer.model'
import { synthesizeGaze } from '../../src/web/GazePointer.model.test-utils'

type StoryProps = ComponentProps<typeof GazePointer> & {
  /** Fills `calibration` from `GazePointerDefaults`, unless a calibration is given */
  preset: keyof typeof GazePointerDefaults
  /** Replaces the webcam by a synthetic face whose gaze follows a scripted path over the targets */
  simulate: boolean
}

export default {
  title: 'Controls/GazePointer',
  component: GazePointer,
  decorators: [
    (Story) => (
      <Setup cameraFov={50} cameraPosition={new THREE.Vector3(0, 0, 7)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
  args: {
    enabled: true,
    preset: 'desktop',
    calibration: undefined,
    tolerance: undefined,
    dwell: 1000,
    blinkGrace: 300,
    voteWindow: 200,
    rays: 7,
    filter: {},
    debug: true,
    simulate: false,
  },
  argTypes: {
    enabled: { control: 'boolean' },
    preset: { control: 'select', options: Object.keys(GazePointerDefaults) },
    calibration: { control: 'object' },
    tolerance: { control: { type: 'number', min: 0, max: 15, step: 0.5 } },
    dwell: { control: { type: 'number', min: 0, max: 5000, step: 100 } },
    blinkGrace: { control: { type: 'number', min: 0, max: 2000, step: 50 } },
    voteWindow: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
    rays: { control: { type: 'number', min: 1, max: 19, step: 1 } },
    filter: { control: 'object' },
    debug: { control: 'boolean' },
    simulate: { control: 'boolean' },
  },
  tags: ['!autodocs'], // FaceLandmarker cannot have multiple instances
} satisfies Meta<StoryProps>

type Story = StoryObj<StoryProps>

//
// The panel: a grid of large targets, plus one hidden behind another
//

const COLUMNS = [-2.4, 0, 2.4]
const ROWS = [1, -1]
const TARGET_SIZE = [1.6, 1.1] as const

const targets = ROWS.flatMap((y, row) =>
  COLUMNS.map((x, column) => ({ name: `target-${row * COLUMNS.length + column}`, position: [x, y, 0] as const }))
)

/** A target the camera cannot see: it sits right behind `target-4` */
const hiddenTarget = { name: 'target-hidden', position: [0, -1, -1.5] as const }

/** Where the simulated gaze goes, on the panel: over targets, then to an empty part */
const SIMULATED_PATH: ReadonlyArray<readonly [x: number, y: number, z: number]> = [
  targets[0].position,
  targets[1].position,
  [-4.6, 0, 0],
  targets[4].position,
  targets[5].position,
  [-4.6, 0, 0],
]

type TargetProps = {
  name: string
  position: readonly [x: number, y: number, z: number]
  size?: readonly [width: number, height: number]
  /** Dwell progress of this target, from 0 to 1 */
  dwell: number
}

/**
 * A button: it lights up while hovered, fills a bar with the dwell progress and counts its clicks.
 * Every pointer event is logged to the console, with the type of pointer it comes from (`gaze` or `mouse`) and
 * where on the button it landed.
 */
function Target({ name, position, size = TARGET_SIZE, dwell }: TargetProps) {
  const [hovered, setHovered] = useState(false)
  const [clicks, setClicks] = useState(0)

  const log = (handler: string, event: ThreeEvent<PointerEvent | MouseEvent>) => {
    const pointerType = 'pointerType' in event.nativeEvent ? event.nativeEvent.pointerType : ''
    const uv = event.uv ? `uv ${event.uv.x.toFixed(2)} ${event.uv.y.toFixed(2)}` : 'no uv'
    console.log(`GazePointer story: ${handler} ${name} (${pointerType}) ${uv}`)
  }

  const [width, height] = size

  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh
        name={name}
        onPointerOver={(event) => {
          log('onPointerOver', event)
          setHovered(true)
        }}
        onPointerOut={(event) => {
          log('onPointerOut', event)
          setHovered(false)
        }}
        onPointerDown={(event) => log('onPointerDown', event)}
        onPointerUp={(event) => log('onPointerUp', event)}
        onClick={(event) => {
          log('onClick', event)
          setClicks((count) => count + 1)
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={hovered ? '#ff9f1c' : '#3a506b'} />
      </mesh>

      {/* dwell progress: a bar that fills from the left */}
      {hovered && dwell > 0 && (
        <mesh position={[(-width * (1 - dwell)) / 2, -height / 2 + 0.06, 0.01]} scale={[dwell, 1, 1]}>
          <planeGeometry args={[width, 0.12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}

      {/* one dot per click */}
      {Array.from({ length: Math.min(clicks, 8) }, (_, index) => (
        <mesh key={index} position={[-width / 2 + 0.15 + index * 0.18, height / 2 - 0.15, 0.01]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#2ec4b6" />
        </mesh>
      ))}
    </group>
  )
}

type PanelPosition = readonly [x: number, y: number, z: number]

/** Where the panel is when the camera of the story looks at it from `z = 7` */
const PANEL_POSITION: PanelPosition = [0, 0, 0]

function Panel({ position, dwell }: { position: PanelPosition; dwell: GazePointerDwellEvent | null }) {
  const progressOf = (name: string) => (dwell?.object.name === name ? dwell.progress : 0)

  return (
    <>
      <color attach="background" args={['#1c2541']} />

      <group position={[position[0], position[1], position[2]]}>
        {targets.map(({ name, position }) => (
          <Target key={name} name={name} position={position} dwell={progressOf(name)} />
        ))}
        <Target {...hiddenTarget} size={[0.8, 0.6]} dwell={progressOf(hiddenTarget.name)} />
      </group>
    </>
  )
}

//
// Simulation: a synthetic face instead of the webcam
//

const SIMULATED_HOLD = 2200 // ms spent on each point of the path
const SIMULATED_TRAVEL = 500 // ms spent between two points
const SIMULATED_RATE = 30 // detections per second

/** The point of the path the gaze is at, `time` milliseconds after the start. */
function simulatedGazeAt(time: number, target = new THREE.Vector3()) {
  const leg = SIMULATED_HOLD + SIMULATED_TRAVEL
  const index = Math.floor(time / leg) % SIMULATED_PATH.length
  const travelled = Math.max(0, (time % leg) - SIMULATED_HOLD) / SIMULATED_TRAVEL

  const from = SIMULATED_PATH[index]
  const to = SIMULATED_PATH[(index + 1) % SIMULATED_PATH.length]

  return target.set(...from).lerp(new THREE.Vector3(...to), travelled)
}

/**
 * A `FaceTracking` fed with the detection of a synthetic face (`synthesizeGaze`) that looks at a point moving along
 * `SIMULATED_PATH`. No webcam and no `FaceLandmarker` are needed.
 */
function SimulatedFaceTracking({
  calibration,
  panelPosition,
  faceLandmarks,
  children,
}: {
  calibration?: GazeCalibration
  /** Where the panel the path is drawn on is, in the world */
  panelPosition: PanelPosition
  /** Landmarks to publish in place of the synthetic ones, which are placeholders except for the irises */
  faceLandmarks?: FaceLandmarkerResult['faceLandmarks']
  children: ReactNode
}) {
  const get = useThree((state) => state.get)
  const [result, setResult] = useState<FaceLandmarkerResult>()

  useEffect(() => {
    const start = performance.now()
    const point = new THREE.Vector3()

    const interval = setInterval(() => {
      const { camera, gl } = get()

      // the point of the path: from the world to the canvas, to the page, to the screen
      simulatedGazeAt(performance.now() - start, point)
      point.set(point.x + panelPosition[0], point.y + panelPosition[1], point.z + panelPosition[2]).project(camera)
      const rect = gl.domElement.getBoundingClientRect()
      const client = {
        x: rect.left + ((point.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - point.y) / 2) * rect.height,
      }
      const target = gazeClientToScreen(client, getGazeViewport())

      try {
        const detection = synthesizeGaze({ target, calibration, screen: getGazeScreen() })
        setResult({ ...detection, faceLandmarks: faceLandmarks ?? detection.faceLandmarks } as FaceLandmarkerResult)
      } catch {
        // the point is out of reach of the eyes: no detection for this frame
      }
    }, 1000 / SIMULATED_RATE)

    return () => clearInterval(interval)
  }, [calibration, faceLandmarks, get, panelPosition])

  return (
    <FaceTracking manualDetect faceLandmarkerResult={result}>
      {children}
    </FaceTracking>
  )
}

/** The props of the story: the preset gives the calibration, unless one is set in the controls. */
function useStoryProps({ preset, simulate, calibration, ...props }: StoryProps) {
  return { simulate, props: { ...props, calibration: calibration ?? GazePointerDefaults[preset] } }
}

/** A `GazePointer` whose dwell progress is shown on the panel, and that the space bar clicks. */
function GazePointerOnPanel({
  panelPosition,
  ...props
}: ComponentProps<typeof GazePointer> & { panelPosition: PanelPosition }) {
  const gazePointerRef = useRef<ComponentRef<typeof GazePointer>>(null)
  const [dwell, setDwell] = useState<GazePointerDwellEvent | null>(null)

  // `click()` is a neutral trigger: here, a key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') gazePointerRef.current?.click()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <GazePointer ref={gazePointerRef} {...props} onDwellProgress={setDwell} />
      <Panel position={panelPosition} dwell={dwell} />
    </>
  )
}

//
// Stories
//

function GazePointerScene(storyProps: StoryProps) {
  const { simulate, props } = useStoryProps(storyProps)

  if (simulate) {
    return (
      <SimulatedFaceTracking calibration={props.calibration} panelPosition={PANEL_POSITION}>
        <GazePointerOnPanel {...props} panelPosition={PANEL_POSITION} />
      </SimulatedFaceTracking>
    )
  }

  return (
    <React.Suspense fallback={null}>
      <FaceLandmarker>
        <GazePointerOnPanel {...props} panelPosition={PANEL_POSITION} />
      </FaceLandmarker>
    </React.Suspense>
  )
}

export const GazePointerSt = {
  render: (args) => <GazePointerScene {...args} />,
  name: 'Default',
} satisfies Story

//

/** `FaceControls` takes the camera to the origin, looking down -z: the panel is put in front of it */
const PANEL_POSITION_2: PanelPosition = [0, 0, -7]

/** `FaceControls` and `GazePointer` under one `FaceTracking`: one webcam, one detection. */
function GazePointerScene2(storyProps: StoryProps) {
  const { simulate, props } = useStoryProps(storyProps)

  const children = (
    <>
      <FaceControls />
      <GazePointerOnPanel {...props} panelPosition={PANEL_POSITION_2} />
    </>
  )

  if (simulate) {
    // `FaceControls` draws a face from the landmarks: it gets those of a real one
    return (
      <SimulatedFaceTracking
        calibration={props.calibration}
        panelPosition={PANEL_POSITION_2}
        faceLandmarks={FacemeshDatas.SAMPLE_FACELANDMARKER_RESULT.faceLandmarks}
      >
        {children}
      </SimulatedFaceTracking>
    )
  }

  return (
    <React.Suspense fallback={null}>
      <FaceLandmarker>
        <FaceTracking>{children}</FaceTracking>
      </FaceLandmarker>
    </React.Suspense>
  )
}

export const GazePointerSt2 = {
  render: (args) => <GazePointerScene2 {...args} />,
  name: 'with FaceControls',
} satisfies Story
