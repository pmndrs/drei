import * as THREE from 'three'
import { Suspense, useCallback, useRef, useState, type ComponentProps, type ComponentRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import {
  Environment,
  CameraControls,
  PerspectiveCamera,
  useHelper,
  useGLTF,
  FaceControls,
  FaceLandmarker,
  useFaceLandmarker,
  VideoTexture,
  WebcamVideoTexture,
} from '@react-three/drei'
import { Grid } from '@react-three/drei/webgpu'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { useControls, buttonGroup, folder } from 'leva'
import { easing } from 'maath'
import { ExampleCard } from '../../../components/ExampleCard'

//* FaceControls Demo ==============================

export default function FaceControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="FaceControls" />

      <div className="demo-canvas">
        <CanvasWithToggle shadows camera={{ position: [-0.6, 0.1, 0.6], near: 0.01 }}>
          <FaceLandmarker>
            <Scene />
          </FaceLandmarker>
        </CanvasWithToggle>
      </div>
    </div>
  )
}

type FaceLandmarkerResult = NonNullable<ComponentProps<typeof FaceControls>['faceLandmarkerResult']>

function Scene() {
  const vids = [
    'https://storage.googleapis.com/abernier-portfolio/metahumans.mp4',
    'https://storage.googleapis.com/abernier-portfolio/metahumans2.mp4',
  ]

  const faceLandmarker = useFaceLandmarker()
  const videoTextureRef = useRef<THREE.VideoTexture>(null)
  const faceControlsApiRef = useRef<ComponentRef<typeof FaceControls>>(null)
  const screenMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const userCamRef = useRef<THREE.PerspectiveCamera | null>(null)
  const [userCam, setUserCam] = useState<THREE.PerspectiveCamera | null>(null)
  const [faceLandmarkerResult, setFaceLandmarkerResult] = useState<FaceLandmarkerResult>()

  const gui = useControls({
    camera: { value: 'user', options: ['user', 'cc'] },
    video: folder({
      // Disabled = webcam. Enable it and pick a file to drive the tracker from a recording instead.
      src: { value: vids[0], options: vids, optional: true, disabled: true },
      playback: buttonGroup({
        opts: {
          pause: () => videoTextureRef.current?.source.data.pause(),
          play: () => videoTextureRef.current?.source.data.play(),
        },
      }),
    }),
    smoothTime: { value: 0.45, min: 0.000001, max: 1 },
    offset: true,
    offsetScalar: { value: 60, min: 0, max: 500 },
    eyes: false,
    eyesAsOrigin: true,
    origin: { value: 0, optional: true, disabled: true, min: 0, max: 477, step: 1 },
    depth: { value: 0.15, min: 0, max: 1, optional: true, disabled: true },
    player: folder({
      rotation: [0, 0, 0],
      position: [-0, 0.2, 0],
    }),
  })

  useHelper(gui.camera !== 'user' && userCamRef, THREE.CameraHelper)

  // manualDetect: the demo owns the video texture, runs detection itself and feeds the result to
  // FaceControls. Owning the texture is also what lets it show the same video on the screen plane.
  const onVideoFrame = useCallback(
    (now: number) => {
      const videoTexture = videoTextureRef.current
      if (!faceLandmarker || !videoTexture) return
      setFaceLandmarkerResult(faceLandmarker.detectForVideo(videoTexture.source.data, now))
      const screenMat = screenMatRef.current
      if (screenMat && screenMat.map !== videoTexture) {
        screenMat.map = videoTexture
        screenMat.needsUpdate = true
      }
    },
    [faceLandmarker]
  )

  // manualUpdate: drive the camera ourselves, with our own damping
  const [current] = useState(() => new THREE.Object3D())
  useFrame((_, delta) => {
    const target = faceControlsApiRef.current?.computeTarget()
    if (!target || !userCam) return
    const eps = 1e-9
    easing.damp3(current.position, target.position, gui.smoothTime, delta, undefined, undefined, eps)
    easing.dampE(current.rotation, target.rotation, gui.smoothTime, delta, undefined, undefined, eps)
    userCam.position.copy(current.position)
    userCam.rotation.copy(current.rotation)
  })

  const setUserCamRef = useCallback((cam: THREE.PerspectiveCamera | null) => {
    userCamRef.current = cam
    setUserCam(cam)
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        {gui.src ? (
          <VideoTexture ref={videoTextureRef} src={gui.src} onVideoFrame={onVideoFrame} />
        ) : (
          <WebcamVideoTexture ref={videoTextureRef} onVideoFrame={onVideoFrame} />
        )}
      </Suspense>

      <group rotation={gui.rotation} position={gui.position}>
        <FaceControls
          ref={faceControlsApiRef}
          camera={userCam ?? undefined}
          makeDefault
          manualDetect
          faceLandmarkerResult={faceLandmarkerResult}
          manualUpdate
          smoothTime={gui.smoothTime}
          offset={gui.offset}
          offsetScalar={gui.offsetScalar}
          eyes={gui.eyes}
          eyesAsOrigin={gui.eyesAsOrigin}
          depth={gui.depth}
          facemesh={{ origin: gui.origin, position: [0, 0, 0] }}
          debug={gui.camera !== 'user'}
        />
        <PerspectiveCamera ref={setUserCamRef} makeDefault={gui.camera === 'user'} fov={70} near={0.1} far={2} />
      </group>

      {/* Video screen plane, fed by the same texture the tracker reads */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0.25, 0]}>
        <planeGeometry args={[0.5, 0.35]} />
        <meshStandardMaterial ref={screenMatRef} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>

      <Plant position={[-0.25, 0, -0.2]} scale={0.5} />

      <Ground />
      <CameraControls />
      <Environment preset="city" />
    </>
  )
}

//* Ground Grid ==============================

function Ground() {
  const gridConfig = {
    cellSize: 0.1,
    cellThickness: 0.5,
    cellColor: '#6f6f6f',
    sectionSize: 1,
    sectionThickness: 1,
    fadeDistance: 10,
    fadeStrength: 2,
    followCamera: false,
    infiniteGrid: true,
  }
  return <Grid args={[10, 10]} {...gridConfig} />
}

//* Plant Model ==============================

function Plant(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('https://storage.googleapis.com/abernier-portfolio/potted_plant.glb')
  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={(nodes.Object_2 as THREE.Mesh).geometry}
          material={materials.model_u1_v1}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={(nodes.Object_3 as THREE.Mesh).geometry}
          material={materials.model_u1_v1}
        />
      </group>
    </group>
  )
}
