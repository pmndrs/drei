/* eslint react-hooks/exhaustive-deps: 1 */
import * as THREE from 'three'
import * as React from 'react'
import { ComponentProps, ComponentRef, CSSProperties, ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber'
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
  GazePoint,
  Html,
  gazeClientToScreen,
  getGazeViewport,
  useFaceTracking,
} from '../../src'
import {
  createGazeBenchmarkRecorder,
  gazeBenchmarkSequence,
  GazeBenchmarkRecorder,
  GazeBenchmarkScore,
  GazeBenchmarkTarget,
  scoreGazeBenchmark,
} from '../../src/web/GazePointer.benchmark'
import { gazeCalibrationSample, GazeCalibrationSample } from '../../src/web/GazePointer.calibration'
import { gazeToScreen, getGazeScreen } from '../../src/web/GazePointer.model'
import { synthesizeGaze } from '../../src/web/GazePointer.model.test-utils'

type StoryProps = ComponentProps<typeof GazePointer> & {
  /** Fills `calibration` from `GazePointerDefaults`, unless a calibration is given */
  preset: keyof typeof GazePointerDefaults
  /**
   * Replaces the webcam by a synthetic face. In `demo` its gaze follows a scripted path over the targets, in
   * `calibrate` it looks at the point being shown, in `benchmark` at the lit target.
   */
  simulate: boolean
  /**
   * What the story shows (the "Default" story only):
   * - `demo`: a panel of buttons to look at
   * - `calibrate`: a calibration screen. The calibration it makes is used by the three modes until the page is left
   * - `benchmark`: a grid of targets lit one at a time, a score, and a JSON export of the session
   */
  mode?: 'demo' | 'calibrate' | 'benchmark'
  /** Which landmarks of each raw detection the export of `benchmark` keeps */
  benchmarkLandmarks?: 'eyes' | 'all'
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

/** Where a point of the world is on the physical screen: from the world to the canvas, to the page, to the screen. */
function worldToScreen(point: THREE.Vector3, camera: THREE.Camera, canvas: HTMLCanvasElement): GazePoint {
  const projected = point.clone().project(camera)
  const rect = canvas.getBoundingClientRect()
  const client = {
    x: rect.left + ((projected.x + 1) / 2) * rect.width,
    y: rect.top + ((1 - projected.y) / 2) * rect.height,
  }

  return gazeClientToScreen(client, getGazeViewport())
}

/** Says where the simulated face looks, in screen pixels. `null`: nowhere new, the latest detection stays. */
type SimulatedGaze = () => GazePoint | null

/**
 * The noise of the simulated face in `calibrate` and `benchmark`, so that their numbers are not trivially perfect:
 * about 1 degree on the raw gaze, for both eye signals.
 */
const SIMULATED_NOISE = { blendshapes: 0.02, landmarks: 0.0002 }

/**
 * A `FaceTracking` fed with the detection of a synthetic face (`synthesizeGaze`). No webcam and no `FaceLandmarker`
 * are needed.
 *
 * The face looks where `gazeRef` says, and otherwise at a point moving along `SIMULATED_PATH`.
 */
function SimulatedFaceTracking({
  calibration,
  panelPosition,
  faceLandmarks,
  gazeRef,
  noise = false,
  children,
}: {
  /** The calibration the face is seen under: the truth of the simulated user, its screen and its webcam */
  calibration?: GazeCalibration
  /** Where the panel the path is drawn on is, in the world */
  panelPosition: PanelPosition
  /** Landmarks to publish in place of the synthetic ones, which are placeholders except for the irises */
  faceLandmarks?: FaceLandmarkerResult['faceLandmarks']
  /** Where the face looks, when the mode of the story decides it */
  gazeRef?: RefObject<SimulatedGaze | null>
  /** Adds `SIMULATED_NOISE` to the signals */
  noise?: boolean
  children: ReactNode
}) {
  const get = useThree((state) => state.get)
  const [result, setResult] = useState<FaceLandmarkerResult>()

  useEffect(() => {
    const start = performance.now()
    const point = new THREE.Vector3()
    let seed = 1

    const interval = setInterval(() => {
      const { camera, gl } = get()

      let target: GazePoint | null
      if (gazeRef) {
        target = gazeRef.current ? gazeRef.current() : null
      } else {
        // the point of the path
        simulatedGazeAt(performance.now() - start, point)
        point.set(point.x + panelPosition[0], point.y + panelPosition[1], point.z + panelPosition[2])
        target = worldToScreen(point, camera, gl.domElement)
      }
      if (!target) return

      try {
        const detection = synthesizeGaze({
          target,
          calibration,
          screen: getGazeScreen(),
          noise: noise ? { ...SIMULATED_NOISE, seed: seed++ } : undefined,
        })
        setResult({ ...detection, faceLandmarks: faceLandmarks ?? detection.faceLandmarks } as FaceLandmarkerResult)
      } catch {
        // the point is out of reach of the eyes: no detection for this frame
      }
    }, 1000 / SIMULATED_RATE)

    return () => clearInterval(interval)
  }, [calibration, faceLandmarks, gazeRef, get, noise, panelPosition])

  return (
    <FaceTracking manualDetect faceLandmarkerResult={result}>
      {children}
    </FaceTracking>
  )
}

/** The props of the story: the preset gives the calibration, unless one is set in the controls. */
function useStoryProps({ preset, simulate, mode = 'demo', benchmarkLandmarks, calibration, ...props }: StoryProps) {
  return {
    simulate,
    mode,
    benchmarkLandmarks,
    props: { ...props, calibration: calibration ?? GazePointerDefaults[preset] },
  }
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
// What `calibrate` and `benchmark` share
//

type ModeProps = ComponentProps<typeof GazePointer> & {
  /** Where to say where the simulated face has to look */
  simulatedGazeRef: RefObject<SimulatedGaze | null>
}

const BACKGROUND = '#1c2541'

const overlayStyle: CSSProperties = {
  pointerEvents: 'none',
  color: '#ffffff',
  font: '16px/1.5 system-ui, sans-serif',
}

const boxStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '32em',
  padding: '1.5em 2em',
  borderRadius: 12,
  background: 'rgba(11, 19, 43, 0.92)',
  textAlign: 'center',
  pointerEvents: 'auto',
}

const buttonStyle: CSSProperties = {
  margin: '1em 0.5em 0',
  padding: '0.6em 1.4em',
  border: 0,
  borderRadius: 8,
  background: '#ff9f1c',
  color: '#0b132b',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
}

/**
 * DOM laid over the whole canvas. The gaze does not drive the DOM: its buttons are clicked with the mouse, which
 * keeps working outside the events of the Canvas.
 */
function Overlay({ children }: { children: ReactNode }) {
  return (
    <Html
      fullscreen
      style={overlayStyle}
      calculatePosition={(_object, _camera, size) => [size.width / 2, size.height / 2]}
    >
      {children}
    </Html>
  )
}

//
// Mode `calibrate`: a reference calibration screen
//

/** What a calibration run leaves: the calibration, and the samples it was solved from (for the benchmark export). */
type Calibrated = { calibration: GazeCalibration; samples: GazeCalibrationSample[] }

/** The five points, as fractions of the canvas: the centre, then four towards the corners, away from the edges. */
const CALIBRATION_POINTS: ReadonlyArray<readonly [x: number, y: number]> = [
  [0.5, 0.5],
  [0.15, 0.15],
  [0.85, 0.15],
  [0.85, 0.85],
  [0.15, 0.85],
]

/**
 * How long a point is shown before its sample is taken, in ms. The eyes need a few hundred milliseconds to reach the
 * point and settle, and `addSample` averages the last 500 ms: with 1500 the sample covers a second of settled gaze.
 */
const CALIBRATION_HOLD = 1500

/** How far back `addSample` averages the detections, in ms. */
const SAMPLE_WINDOW = 500

/**
 * A calibration screen, built on the ref of `GazePointer`:
 * 1. a point is shown; the user looks at it
 * 2. after `CALIBRATION_HOLD`, `addSample()` records where the point is on the screen. The point is a DOM element:
 *    its position on the page becomes a position on the screen with `gazeClientToScreen()` and `getGazeViewport()`.
 *    When no face was seen (`false`), the same point is shown again
 * 3. after the fifth point, `solve()` gives the calibration, or `null` when the samples cannot be solved
 * 4. the calibration is handed to the app (here, the story), which passes it back as the `calibration` prop.
 */
function Calibrate({
  simulatedGazeRef,
  onCalibrated,
  ...props
}: ModeProps & { onCalibrated: (calibrated: Calibrated | null) => void }) {
  const gazePointerRef = useRef<ComponentRef<typeof GazePointer>>(null)
  const pointRef = useRef<HTMLDivElement>(null)

  /** The point being shown, and how many times it had to be shown again. `null`: not running */
  const [step, setStep] = useState<{ index: number; attempt: number } | null>(null)
  /** How the last run ended: the residual of its calibration in degrees, or `failed` */
  const [outcome, setOutcome] = useState<number | 'failed' | null>(null)

  /** Where the point being shown is on the screen */
  const [pointOnScreen] = useState(() => (): GazePoint | null => {
    const rect = pointRef.current?.getBoundingClientRect()
    if (!rect) return null

    return gazeClientToScreen({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, getGazeViewport())
  })

  // the simulated face looks at the point being shown
  useEffect(() => {
    simulatedGazeRef.current = pointOnScreen
    return () => {
      simulatedGazeRef.current = null
    }
  }, [pointOnScreen, simulatedGazeRef])

  // The samples are internal to `GazePointer`. The story builds its own copy of each, from the same detections, only
  // so that the benchmark export can carry them: a calibration screen does not need this.
  const faceTracking = useFaceTracking()
  const [recent] = useState<{ time: number; detection: FaceLandmarkerResult }[]>(() => [])
  const [samples] = useState<GazeCalibrationSample[]>(() => [])
  useEffect(() => {
    return faceTracking?.subscribe((detection) => {
      if (!detection) return
      recent.push({ time: performance.now(), detection })
      if (recent.length > 60) recent.shift()
    })
  }, [faceTracking, recent])

  const start = () => {
    // back to the calibration of the controls: `solve()` starts from the `calibration` prop
    onCalibrated(null)
    gazePointerRef.current?.clearSamples()
    samples.length = 0
    setOutcome(null)
    setStep({ index: 0, attempt: 0 })
  }

  useEffect(() => {
    if (!step) return

    const timer = setTimeout(() => {
      const gazePointer = gazePointerRef.current
      const target = pointOnScreen()
      if (!gazePointer || !target) return

      // no face in the last half second: the same point again
      if (!gazePointer.addSample(target)) {
        setStep({ index: step.index, attempt: step.attempt + 1 })
        return
      }

      const since = performance.now() - SAMPLE_WINDOW
      const detections = recent.filter(({ time }) => time >= since).map(({ detection }) => detection)
      const sample = gazeCalibrationSample(target, detections)
      if (sample) samples.push(sample)

      if (step.index + 1 < CALIBRATION_POINTS.length) {
        setStep({ index: step.index + 1, attempt: 0 })
        return
      }

      const calibration = gazePointer.solve()
      setStep(null)
      setOutcome(calibration ? (calibration.residual ?? 0) : 'failed')
      if (calibration) onCalibrated({ calibration, samples: [...samples] })
    }, CALIBRATION_HOLD)

    return () => clearTimeout(timer)
  }, [onCalibrated, pointOnScreen, recent, samples, step])

  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      <GazePointer ref={gazePointerRef} {...props} dwell={false} />

      <Overlay>
        {step ? (
          <>
            <div
              ref={pointRef}
              data-gaze-calibrate="point"
              data-index={step.index}
              style={{
                position: 'absolute',
                left: `${CALIBRATION_POINTS[step.index][0] * 100}%`,
                top: `${CALIBRATION_POINTS[step.index][1] * 100}%`,
                width: 28,
                height: 28,
                margin: -14,
                boxSizing: 'border-box',
                borderRadius: '50%',
                border: '10px solid #ff9f1c',
                background: '#ffffff',
              }}
            />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '1em', textAlign: 'center' }}>
              Look at the point: {step.index + 1} / {CALIBRATION_POINTS.length}
              {step.attempt > 0 && ' (no face was seen, same point again)'}
            </div>
          </>
        ) : (
          <div style={boxStyle} data-gaze-calibrate="status">
            {outcome === null && (
              <p>
                Five points are shown one after the other. Keep your head still and look at each point until it moves.
              </p>
            )}
            {typeof outcome === 'number' && (
              <p>
                Calibrated. Residual: <strong data-gaze-calibrate="residual">{outcome.toFixed(2)}</strong> degrees.
                <br />
                The calibration is used by the three modes until this page is left.
              </p>
            )}
            {outcome === 'failed' && (
              <p data-gaze-calibrate="failed">
                The calibration failed: the samples could not be solved. Look at each point until it moves, then try
                again.
              </p>
            )}
            <button type="button" style={buttonStyle} data-gaze-calibrate="start" onClick={start}>
              {outcome === null ? 'Start' : 'Calibrate again'}
            </button>
          </div>
        )}
      </Overlay>
    </>
  )
}

//
// Mode `benchmark`: a grid of targets lit one at a time, a score, and an export
//

const BENCHMARK_COLUMNS = 4
const BENCHMARK_ROWS = 3
/** How many times each target is lit */
const BENCHMARK_ROUNDS = 2
/** How long a target stays lit, in ms */
const BENCHMARK_LIT = 2500
/** The share of its cell a target fills: the rest is the gap between neighbours */
const BENCHMARK_FILL = 0.94

/** A running session. */
type BenchmarkRun = {
  /** `performance.now()` when the first target lit up */
  start: number
  /** The index of the target to light, for each lit period */
  sequence: number[]
  /** Where each target is on the screen */
  layout: GazeBenchmarkTarget[]
  recorder: GazeBenchmarkRecorder
  /** Width over height of the video, when there is one */
  aspect: number | undefined
  /** The index of the lit target */
  lit: number | null
  /** Distance between the eyes and the latest gaze point, in centimetres */
  distance: number | null
}

/**
 * A benchmark of the pointer: a 4 by 3 grid of targets covers the canvas, and one of them is lit at a time, in a
 * random order. The user looks at the lit target. Every frame is recorded: the lit target, the elected target and the
 * gaze point read on the ref of `GazePointer`, and the raw detection read on `FaceTracking`.
 *
 * At the end the session is scored (`scoreGazeBenchmark`) and can be downloaded as JSON, to be replayed offline with
 * other settings (`replayGazeBenchmark`). The file is built in the page; nothing is sent anywhere.
 */
function Benchmark({
  simulatedGazeRef,
  calibrationSamples,
  landmarks = 'eyes',
  ...props
}: ModeProps & { calibrationSamples: GazeCalibrationSample[]; landmarks?: 'eyes' | 'all' }) {
  const gazePointerRef = useRef<ComponentRef<typeof GazePointer>>(null)
  const faceTracking = useFaceTracking()
  const get = useThree((state) => state.get)

  // the grid covers what the camera sees of the plane z = 0
  const viewport = useThree((state) => state.viewport)
  const cell = { width: viewport.width / BENCHMARK_COLUMNS, height: viewport.height / BENCHMARK_ROWS }
  const size = { width: cell.width * BENCHMARK_FILL, height: cell.height * BENCHMARK_FILL }
  const grid = Array.from({ length: BENCHMARK_COLUMNS * BENCHMARK_ROWS }, (_, index) => ({
    name: `benchmark-${index}`,
    // row by row, from the top left
    x: ((index % BENCHMARK_COLUMNS) + 0.5) * cell.width - viewport.width / 2,
    y: viewport.height / 2 - (Math.floor(index / BENCHMARK_COLUMNS) + 0.5) * cell.height,
  }))

  const runRef = useRef<BenchmarkRun | null>(null)
  const [lit, setLit] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [result, setResult] = useState<{ score: GazeBenchmarkScore; json: string; recordedAt: string } | null>(null)

  // the simulated face looks at the centre of the lit target
  useEffect(() => {
    simulatedGazeRef.current = () => {
      const run = runRef.current
      if (!run || run.lit === null) return null

      const target = run.layout[run.lit]
      return { x: target.left + target.width / 2, y: target.top + target.height / 2 }
    }
    return () => {
      simulatedGazeRef.current = null
    }
  }, [simulatedGazeRef])

  const start = () => {
    const { camera, gl } = get()
    const canvas = gl.domElement
    const viewportOnScreen = getGazeViewport()

    // where each target is on the screen, from its corners in the world
    const layout = grid.map(({ name, x, y }): GazeBenchmarkTarget => {
      const topLeft = worldToScreen(new THREE.Vector3(x - size.width / 2, y + size.height / 2, 0), camera, canvas)
      const bottomRight = worldToScreen(new THREE.Vector3(x + size.width / 2, y - size.height / 2, 0), camera, canvas)
      return {
        id: name,
        left: round(topLeft.x),
        top: round(topLeft.y),
        width: round(bottomRight.x - topLeft.x),
        height: round(bottomRight.y - topLeft.y),
      }
    })

    const rect = canvas.getBoundingClientRect()
    const canvasOnScreen = gazeClientToScreen({ x: rect.left, y: rect.top }, viewportOnScreen)

    const video: Partial<HTMLVideoElement> | undefined = faceTracking?.videoTextureRef.current?.image
    const aspect = video?.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : undefined

    const seed = Date.now() % 1000000
    const recordedAt = new Date().toISOString()

    runRef.current = {
      start: performance.now(),
      sequence: gazeBenchmarkSequence(grid.length, BENCHMARK_ROUNDS, seed),
      layout,
      recorder: createGazeBenchmarkRecorder({
        recordedAt,
        screen: getGazeScreen(),
        viewport: viewportOnScreen,
        canvas: { left: canvasOnScreen.x, top: canvasOnScreen.y, width: rect.width, height: rect.height },
        calibration: props.calibration ?? {},
        calibrationSamples,
        // what the pointer runs with: its props, and the eye signal and the video aspect it uses by itself
        options: {
          eyeSignal: 'blendshapes',
          tolerance: props.tolerance,
          voteWindow: props.voteWindow,
          blinkGrace: props.blinkGrace,
          filter: props.filter,
          rays: props.rays,
          aspect,
        },
        litDuration: BENCHMARK_LIT,
        seed,
        targets: layout,
        landmarks,
      }),
      aspect,
      lit: null,
      distance: null,
    }
    setResult(null)
  }

  // One frame of the session. This component is the parent of `GazePointer`, so its frame callback runs after the
  // one of the pointer: the ref holds what the pointer made of this very frame.
  useFrame(() => {
    const run = runRef.current
    const gazePointer = gazePointerRef.current
    if (!run || !gazePointer) return

    const time = performance.now() - run.start
    const period = Math.floor(time / BENCHMARK_LIT)

    // the last target has been lit long enough: the session is over
    if (period >= run.sequence.length) {
      const session = run.recorder.finish()
      runRef.current = null
      setLit(null)
      setResult({ score: scoreGazeBenchmark(session), json: JSON.stringify(session), recordedAt: session.recordedAt })
      return
    }

    const index = run.sequence[period]
    if (index !== run.lit) {
      run.lit = index
      setLit(index)
    }

    // the distance between the eyes and the screen, which turns the error of the frame into degrees
    const detection = faceTracking?.getResult()
    const onScreen = detection && gazeToScreen(detection, props.calibration, { aspect: run.aspect })
    if (onScreen) run.distance = onScreen.distance

    const point = gazePointer.point
    run.recorder.record({
      time,
      lit: run.layout[index].id,
      elected: gazePointer.target ? gazePointer.target.name : null,
      point,
      distance: point ? run.distance : null,
      detection,
    })
  })

  // a local download: the file is made in the page, from a Blob
  const download = () => {
    if (!result) return

    const url = URL.createObjectURL(new Blob([result.json], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `gaze-benchmark-${result.recordedAt.replace(/[:.]/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const running = lit !== null
  const trials = grid.length * BENCHMARK_ROUNDS
  const score = result?.score

  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      <GazePointer ref={gazePointerRef} {...props} dwell={false} />

      {grid.map(({ name, x, y }, index) => (
        <mesh
          key={name}
          name={name}
          position={[x, y, 0]}
          onPointerOver={() => setHovered(index)}
          onPointerOut={() => setHovered((current) => (current === index ? null : current))}
        >
          <planeGeometry args={[size.width, size.height]} />
          <meshBasicMaterial color={lit === index ? '#ff9f1c' : hovered === index ? '#5c7ea3' : '#3a506b'} />
        </mesh>
      ))}

      {!running && (
        <Overlay>
          <div style={boxStyle} data-gaze-benchmark="status">
            {score ? (
              <>
                <p>
                  Lit target elected:{' '}
                  <strong data-gaze-benchmark="correct-share">{formatNumber(score.correctShare, 100, 1)}</strong> % of
                  the time
                  <br />
                  Target changes:{' '}
                  <strong data-gaze-benchmark="changes">{formatNumber(score.changesPer10s, 1, 2)}</strong> per 10
                  seconds
                  <br />
                  Median error:{' '}
                  <strong data-gaze-benchmark="median-error">{formatNumber(score.medianError, 1, 2)}</strong> degrees
                </p>
                <p style={{ fontSize: '0.85em', opacity: 0.8 }}>
                  Measured over {(score.scoredTime / 1000).toFixed(1)} seconds: the first {score.settle} ms after each
                  target lights up are left out. {score.framesWithoutPoint} of the {score.frames} measured frames had no
                  gaze point.
                </p>
                <button type="button" style={buttonStyle} data-gaze-benchmark="download" onClick={download}>
                  Download JSON (<span data-gaze-benchmark="size">{(result.json.length / 1e6).toFixed(1)}</span> MB)
                </button>
              </>
            ) : (
              <p>
                {trials} targets light up one after the other, for {BENCHMARK_LIT / 1000} seconds each (
                {(trials * BENCHMARK_LIT) / 1000} seconds in all). Look at the lit one. Calibrate first, in the{' '}
                <code>calibrate</code> mode.
              </p>
            )}
            <button type="button" style={buttonStyle} data-gaze-benchmark="start" onClick={start}>
              {score ? 'Run again' : 'Start'}
            </button>
          </div>
        </Overlay>
      )}
    </>
  )
}

/** A tenth of a pixel is plenty for the layout of the targets. */
function round(value: number) {
  return Math.round(value * 10) / 10
}

/** A measure as text, `-` when there is nothing to say. */
function formatNumber(value: number | null, factor: number, decimals: number) {
  return value === null ? '-' : (value * factor).toFixed(decimals)
}

//
// Stories
//

function GazePointerScene(storyProps: StoryProps) {
  const { simulate, mode, benchmarkLandmarks, props } = useStoryProps(storyProps)

  // The calibration made in `calibrate`. It lives here, in the state of the story: the three modes use it until the
  // page is left, and nothing stores it.
  const [calibrated, setCalibrated] = useState<Calibrated | null>(null)
  const pointerProps = { ...props, calibration: calibrated?.calibration ?? props.calibration }

  /** Where the simulated face looks in `calibrate` and `benchmark` */
  const simulatedGazeRef = useRef<SimulatedGaze | null>(null)

  if (mode === 'demo') {
    // The simulated face stays the one of the controls: it does not follow the calibration made in `calibrate`.
    if (simulate) {
      return (
        <SimulatedFaceTracking calibration={props.calibration} panelPosition={PANEL_POSITION}>
          <GazePointerOnPanel {...pointerProps} panelPosition={PANEL_POSITION} />
        </SimulatedFaceTracking>
      )
    }

    return (
      <React.Suspense fallback={null}>
        <FaceLandmarker>
          <GazePointerOnPanel {...pointerProps} panelPosition={PANEL_POSITION} />
        </FaceLandmarker>
      </React.Suspense>
    )
  }

  const children =
    mode === 'calibrate' ? (
      <Calibrate {...pointerProps} simulatedGazeRef={simulatedGazeRef} onCalibrated={setCalibrated} />
    ) : (
      <Benchmark
        {...pointerProps}
        simulatedGazeRef={simulatedGazeRef}
        calibrationSamples={calibrated?.samples ?? []}
        landmarks={benchmarkLandmarks}
      />
    )

  // These two modes read the raw detections, so they need a `FaceTracking` of their own above the pointer.
  if (simulate) {
    return (
      <SimulatedFaceTracking
        calibration={props.calibration}
        panelPosition={PANEL_POSITION}
        gazeRef={simulatedGazeRef}
        noise
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

export const GazePointerSt = {
  render: (args) => <GazePointerScene {...args} />,
  name: 'Default',
  args: { mode: 'demo', benchmarkLandmarks: 'eyes' },
  argTypes: {
    mode: { control: 'inline-radio', options: ['demo', 'calibrate', 'benchmark'] },
    benchmarkLandmarks: { control: 'inline-radio', options: ['eyes', 'all'], if: { arg: 'mode', eq: 'benchmark' } },
  },
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
