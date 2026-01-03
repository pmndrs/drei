//* Demo Imports ==============================

// Core - Cameras
import OrthographicCameraDemo from './core/cameras/OrthographicCamera'
import PerspectiveCameraDemo from './core/cameras/PerspectiveCamera'
import UseCustomRaycastDemo from './core/cameras/UseCustomRaycast'
// Core - Controls
import ArcballControlsDemo from './core/controls/ArcballControls'
import OrbitControlsDemo from './core/controls/OrbitControls'
import MapControlsDemo from './core/controls/MapControls'
import TrackballControlsDemo from './core/controls/TrackballControls'
import FlyControlsDemo from './core/controls/FlyControls'
import PointerLockControlsDemo from './core/controls/PointLockControls'
import DeviceOrientationControlsDemo from './core/controls/DeviceOrientationControls'
import DragControlsDemo from './core/controls/DragControls'
import FirstPersonControlsDemo from './core/controls/FirstPersonControls'
import KeyboardControlsDemo from './core/controls/KeyboardControls'
import PivotControlsDemo from './core/controls/PivotControls'
import TransformControlsDemo from './core/controls/TransformControls'
import MotionPathControlsDemo from './core/controls/MotionPathControls'
import PresentationControlsDemo from './core/controls/PresentationControls'
import FaceControlsDemo from './core/controls/FaceControls'
import SelectDemo from './core/controls/Select'
import ScrollControlsDemo from './core/controls/ScrollControls'
import GizmoHelperDemo from './core/controls/GizmoHelper'

export interface Demo {
  path: string
  name: string
  component: React.ComponentType
  tier: 'core' | 'legacy' | 'webgpu' | 'external' | 'experimental'
  category: string
  title: string
  description: string
}

export const demos: Demo[] = [
  // Core - Cameras
  {
    path: '/core/cameras/orthographic',
    name: 'OrthographicCamera',
    component: OrthographicCameraDemo,
    tier: 'core',
    category: 'Cameras',
    title: 'Orthographic Camera',
    description: 'A camera that uses an orthographic projection.',
  },
  {
    path: '/core/cameras/perspective',
    name: 'PerspectiveCamera',
    component: PerspectiveCameraDemo,
    tier: 'core',
    category: 'Cameras',
    title: 'Perspective Camera',
    description: 'A camera that uses a perspective projection.',
  },
  {
    path: '/core/cameras/usecustomraycast',
    name: 'UseCustomRaycast',
    component: UseCustomRaycastDemo,
    tier: 'core',
    category: 'Cameras',
    title: 'Use Custom Raycast',
    description: 'A camera that uses a custom raycast.',
  },

  // Core - Controls
  {
    path: '/core/controls/orbit',
    name: 'OrbitControls',
    component: OrbitControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Orbit Controls',
    description: 'A control that allows the camera to orbit around the scene.',
  },
  {
    path: '/core/controls/arcball',
    name: 'ArcballControls',
    component: ArcballControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Arcball Controls',
    description: 'A control that allows the camera to orbit around the scene.',
  },
  {
    path: '/core/controls/map',
    name: 'MapControls',
    component: MapControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Map Controls',
    description: 'A control that allows the camera to move around the scene.',
  },
  {
    path: '/core/controls/pointerlock',
    name: 'PointerLockControls',
    component: PointerLockControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Pointer Lock Controls',
    description: 'A control that allows the camera to lock to the scene.',
  },
  {
    path: '/core/controls/trackball',
    name: 'TrackballControls',
    component: TrackballControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Trackball Controls',
    description: 'A control that allows the camera to orbit around the scene.',
  },
  {
    path: '/core/controls/fly',
    name: 'FlyControls',
    component: FlyControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Fly Controls',
    description: 'A control that allows the camera to fly around the scene.',
  },
  {
    path: '/core/controls/deviceorientation',
    name: 'DeviceOrientationControls',
    component: DeviceOrientationControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Device Orientation Controls',
    description: 'Control camera with device orientation (mobile/gyroscope).',
  },
  {
    path: '/core/controls/drag',
    name: 'DragControls',
    component: DragControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Drag Controls',
    description: 'Drag objects in the scene with mouse.',
  },
  {
    path: '/core/controls/firstperson',
    name: 'FirstPersonControls',
    component: FirstPersonControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'First Person Controls',
    description: 'First-person shooter style camera controls.',
  },
  {
    path: '/core/controls/keyboard',
    name: 'KeyboardControls',
    component: KeyboardControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Keyboard Controls',
    description: 'Keyboard input management for scene interactions.',
  },
  {
    path: '/core/controls/pivot',
    name: 'PivotControls',
    component: PivotControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Pivot Controls',
    description: 'Transform gizmo for moving, rotating, and scaling objects.',
  },
  {
    path: '/core/controls/transform',
    name: 'TransformControls',
    component: TransformControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Transform Controls',
    description: 'Three.js TransformControls for precise object manipulation.',
  },
  {
    path: '/core/controls/motionpath',
    name: 'MotionPathControls',
    component: MotionPathControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Motion Path Controls',
    description: 'Animate camera along a curved path.',
  },
  {
    path: '/core/controls/presentation',
    name: 'PresentationControls',
    component: PresentationControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Presentation Controls',
    description: 'Drag-to-rotate controls ideal for product showcases.',
  },
  {
    path: '/core/controls/face',
    name: 'FaceControls',
    component: FaceControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Face Controls',
    description: 'Control camera with face tracking (requires webcam and MediaPipe).',
  },
  {
    path: '/core/controls/select',
    name: 'Select',
    component: SelectDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Select',
    description: 'Click and box-select objects in the scene.',
  },
  {
    path: '/core/controls/scroll',
    name: 'ScrollControls',
    component: ScrollControlsDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Scroll Controls',
    description: 'Create scroll-based animations and interactions.',
  },
  {
    path: '/core/controls/gizmo',
    name: 'GizmoHelper',
    component: GizmoHelperDemo,
    tier: 'core',
    category: 'Controls',
    title: 'Gizmo Helper',
    description: 'Visual orientation helper showing scene axes.',
  },

  // Add more demos here as you create them...
]

export const getMetadata = (demoName: string) => {
  const demo = demos.find((demo) => demo.name === demoName)
  if (!demo) {
    throw new Error(`Demo ${demoName} not found`)
  }
  return demo
}
