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

// Core - Abstractions
import AsciiRendererDemo from './core/abstractions/AsciiRenderer'
import BillboardDemo from './core/abstractions/Billboard'
import CloneDemo from './core/abstractions/Clone'
import ComputedAttributeDemo from './core/abstractions/ComputedAttribute'
import ExampleDemo from './core/abstractions/Example'
import InstancesDemo from './core/abstractions/Instances'
import SamplerDemo from './core/abstractions/Sampler'
import ScreenSpaceDemo from './core/abstractions/ScreenSpace'
import SvgDemo from './core/abstractions/Svg'

// Core - Effects
import CameraShakeDemo from './core/effects/CameraShake'
import CloudDemo from './core/effects/Cloud'
import SparklesDemo from './core/effects/Sparkles'

// Core - Geometry
import CatmullRomLineDemo from './core/geometry/CatmullRomLine'
import CubicBezierLineDemo from './core/geometry/CubicBezierLine'
import CurveModifierDemo from './core/geometry/CurveModifier'
import DecalDemo from './core/geometry/Decal'
import DetailedDemo from './core/geometry/Detailed'
import EdgesDemo from './core/geometry/Edges'
import LineDemo from './core/geometry/Line'
import PointsDemo from './core/geometry/Points'
import QuadraticBezierLineDemo from './core/geometry/QuadraticBezierLine'
import RoundedBoxDemo from './core/geometry/RoundedBox'
import ScreenQuadDemo from './core/geometry/ScreenQuad'
import SegmentsDemo from './core/geometry/Segments'
import Text3DDemo from './core/geometry/Text3D'
import TrailDemo from './core/geometry/Trail'
import WireframeDemo from './core/geometry/Wireframe'

// Core - Helpers
import CycleRaycastDemo from './core/helpers/CycleRaycast'
import FboDemo from './core/helpers/Fbo'
import HtmlDemo from './core/helpers/Html'
import PointMaterialDemo from './core/helpers/PointMaterial'
import PositionalAudioDemo from './core/helpers/PositionalAudio'
import SpriteAnimatorDemo from './core/helpers/SpriteAnimator'
import TextDemo from './core/helpers/Text'
import UseAnimationsDemo from './core/helpers/useAnimations'
import UseContextBridgeDemo from './core/helpers/useContextBridge'

// Core - Loaders
import CubeTextureDemo from './core/loaders/CubeTexture'
import LoaderDemo from './core/loaders/Loader'
import MatcapTextureDemo from './core/loaders/MatcapTexture'
import PreloadDemo from './core/loaders/Preload'
import ScreenVideoTextureDemo from './core/loaders/ScreenVideoTexture'
import TrailTextureDemo from './core/loaders/TrailTexture'
import UseFBXDemo from './core/loaders/useFBX'
import UseFontDemo from './core/loaders/useFont'
import UseGLTFDemo from './core/loaders/useGLTF'
import UseKTX2Demo from './core/loaders/useKTX2'
import UseProgressDemo from './core/loaders/useProgress'
import UseSpriteLoaderDemo from './core/loaders/useSpriteLoader'
import UseTextureDemo from './core/loaders/useTexture'
import VideoTextureDemo from './core/loaders/VideoTexture'
import WebcamVideoTextureDemo from './core/loaders/WebcamVideoTexture'

// Core - Performance
import AdaptiveDprDemo from './core/performance/AdaptiveDpr'
import AdaptiveEventsDemo from './core/performance/AdaptiveEvents'
import DetectGPUDemo from './core/performance/DetectGPU'
import MeshBoundsDemo from './core/performance/meshBounds'
import PerformanceMonitorDemo from './core/performance/PerformanceMonitor'
import StatsDemo from './core/performance/Stats'
import StatsGlDemo from './core/performance/StatsGl'

// Core - Portal
import FisheyeDemo from './core/portal/Fisheye'
import MaskDemo from './core/portal/Mask'
import RenderTextureDemo from './core/portal/RenderTexture'
import ViewDemo from './core/portal/View'

// Core - Staging
import BackdropDemo from './core/staging/Backdrop'
import BBAnchorDemo from './core/staging/BBAnchor'
import BoundsDemo from './core/staging/Bounds'
import CenterDemo from './core/staging/Center'
import EnvironmentDemo from './core/staging/Environment'
import FloatDemo from './core/staging/Float'
import GridDemo from './core/staging/Grid'
import LightformerDemo from './core/staging/Lightformer'
import ResizeDemo from './core/staging/Resize'
import ScreenSizerDemo from './core/staging/ScreenSizer'
import ShadowDemo from './core/staging/Shadow'
import SkyDemo from './core/staging/Sky'
import StageDemo from './core/staging/Stage'
import StarsDemo from './core/staging/Stars'
import UseBoxProjectedEnvDemo from './core/staging/useBoxProjectedEnv'
import UseEnvironmentDemo from './core/staging/useEnvironment'

// Core - UI
import UseAspectDemo from './core/ui/useAspect'
import UseCursorDemo from './core/ui/useCursor'
import UseIntersectDemo from './core/ui/useIntersect'

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

  // Core - Abstractions
  {
    path: '/core/abstractions/asciirenderer',
    name: 'AsciiRenderer',
    component: AsciiRendererDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'ASCII Renderer',
    description: 'Render the 3D scene as ASCII art characters.',
  },
  {
    path: '/core/abstractions/billboard',
    name: 'Billboard',
    component: BillboardDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'Billboard',
    description: 'Objects that always face the camera.',
  },
  {
    path: '/core/abstractions/clone',
    name: 'Clone',
    component: CloneDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'Clone',
    description: 'Clone and reuse geometries and materials.',
  },
  {
    path: '/core/abstractions/computedattribute',
    name: 'ComputedAttribute',
    component: ComputedAttributeDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'Computed Attribute',
    description: 'Dynamically computed geometry attributes.',
  },
  {
    path: '/core/abstractions/example',
    name: 'Example',
    component: ExampleDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'Example',
    description: 'Example counter component demonstration.',
  },
  {
    path: '/core/abstractions/instances',
    name: 'Instances',
    component: InstancesDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'Instances',
    description: 'Efficient instanced rendering for many objects.',
  },
  {
    path: '/core/abstractions/sampler',
    name: 'Sampler',
    component: SamplerDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'Sampler',
    description: 'Sample points on mesh surfaces.',
  },
  {
    path: '/core/abstractions/screenspace',
    name: 'ScreenSpace',
    component: ScreenSpaceDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'Screen Space',
    description: 'Render objects in screen space coordinates.',
  },
  {
    path: '/core/abstractions/svg',
    name: 'Svg',
    component: SvgDemo,
    tier: 'core',
    category: 'Abstractions',
    title: 'SVG',
    description: 'Render SVG graphics in 3D space.',
  },

  // Core - Effects
  {
    path: '/core/effects/camerashake',
    name: 'CameraShake',
    component: CameraShakeDemo,
    tier: 'core',
    category: 'Effects',
    title: 'Camera Shake',
    description: 'Add camera shake effects for impact and motion.',
  },
  {
    path: '/core/effects/cloud',
    name: 'Cloud',
    component: CloudDemo,
    tier: 'core',
    category: 'Effects',
    title: 'Cloud',
    description: 'Volumetric cloud effects.',
  },
  {
    path: '/core/effects/sparkles',
    name: 'Sparkles',
    component: SparklesDemo,
    tier: 'core',
    category: 'Effects',
    title: 'Sparkles',
    description: 'Particle sparkle effects.',
  },

  // Core - Geometry
  {
    path: '/core/geometry/catmullromline',
    name: 'CatmullRomLine',
    component: CatmullRomLineDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Catmull-Rom Line',
    description: 'Smooth Catmull-Rom curve lines.',
  },
  {
    path: '/core/geometry/cubicbezierline',
    name: 'CubicBezierLine',
    component: CubicBezierLineDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Cubic Bezier Line',
    description: 'Cubic Bezier curve lines.',
  },
  {
    path: '/core/geometry/curvemodifier',
    name: 'CurveModifier',
    component: CurveModifierDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Curve Modifier',
    description: 'Deform geometry along a curve path.',
  },
  {
    path: '/core/geometry/decal',
    name: 'Decal',
    component: DecalDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Decal',
    description: 'Project decals onto mesh surfaces.',
  },
  {
    path: '/core/geometry/detailed',
    name: 'Detailed',
    component: DetailedDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Detailed',
    description: 'Level of detail (LOD) system for optimization.',
  },
  {
    path: '/core/geometry/edges',
    name: 'Edges',
    component: EdgesDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Edges',
    description: 'Render mesh edges with customizable appearance.',
  },
  {
    path: '/core/geometry/line',
    name: 'Line',
    component: LineDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Line',
    description: 'Render lines in 3D space.',
  },
  {
    path: '/core/geometry/points',
    name: 'Points',
    component: PointsDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Points',
    description: 'Point cloud rendering.',
  },
  {
    path: '/core/geometry/quadraticbezierline',
    name: 'QuadraticBezierLine',
    component: QuadraticBezierLineDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Quadratic Bezier Line',
    description: 'Quadratic Bezier curve lines.',
  },
  {
    path: '/core/geometry/roundedbox',
    name: 'RoundedBox',
    component: RoundedBoxDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Rounded Box',
    description: 'Box geometry with rounded edges.',
  },
  {
    path: '/core/geometry/screenquad',
    name: 'ScreenQuad',
    component: ScreenQuadDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Screen Quad',
    description: 'Fullscreen quad for post-processing effects.',
  },
  {
    path: '/core/geometry/segments',
    name: 'Segments',
    component: SegmentsDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Segments',
    description: 'Individual line segments with colors and styles.',
  },
  {
    path: '/core/geometry/text3d',
    name: 'Text3D',
    component: Text3DDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Text3D',
    description: '3D text geometry with extrusion.',
  },
  {
    path: '/core/geometry/trail',
    name: 'Trail',
    component: TrailDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Trail',
    description: 'Motion trail effects for moving objects.',
  },
  {
    path: '/core/geometry/wireframe',
    name: 'Wireframe',
    component: WireframeDemo,
    tier: 'core',
    category: 'Geometry',
    title: 'Wireframe',
    description: 'Wireframe rendering for meshes.',
  },

  // Core - Helpers
  {
    path: '/core/helpers/cycleraycast',
    name: 'CycleRaycast',
    component: CycleRaycastDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'Cycle Raycast',
    description: 'Cycle through overlapping raycasted objects.',
  },
  {
    path: '/core/helpers/fbo',
    name: 'Fbo',
    component: FboDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'FBO',
    description: 'Framebuffer object helper for render targets.',
  },
  {
    path: '/core/helpers/html',
    name: 'Html',
    component: HtmlDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'HTML',
    description: 'Overlay HTML content on 3D objects.',
  },
  {
    path: '/core/helpers/pointmaterial',
    name: 'PointMaterial',
    component: PointMaterialDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'Point Material',
    description: 'Material helper for point rendering.',
  },
  {
    path: '/core/helpers/positionalaudio',
    name: 'PositionalAudio',
    component: PositionalAudioDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'Positional Audio',
    description: '3D positional audio in space.',
  },
  {
    path: '/core/helpers/spriteanimator',
    name: 'SpriteAnimator',
    component: SpriteAnimatorDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'Sprite Animator',
    description: 'Animate sprite sheets.',
  },
  {
    path: '/core/helpers/text',
    name: 'Text',
    component: TextDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'Text',
    description: '2D text rendering with Troika.',
  },
  {
    path: '/core/helpers/useanimations',
    name: 'useAnimations',
    component: UseAnimationsDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'useAnimations',
    description: 'Hook for managing GLTF animations.',
  },
  {
    path: '/core/helpers/usecontextbridge',
    name: 'useContextBridge',
    component: UseContextBridgeDemo,
    tier: 'core',
    category: 'Helpers',
    title: 'useContextBridge',
    description: 'Bridge React contexts across portals.',
  },

  // Core - Loaders
  {
    path: '/core/loaders/cubetexture',
    name: 'CubeTexture',
    component: CubeTextureDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Cube Texture',
    description: 'Load cube map textures for environments.',
  },
  {
    path: '/core/loaders/loader',
    name: 'Loader',
    component: LoaderDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Loader',
    description: 'Loading UI component.',
  },
  {
    path: '/core/loaders/matcaptexture',
    name: 'MatcapTexture',
    component: MatcapTextureDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Matcap Texture',
    description: 'Load matcap textures for materials.',
  },
  {
    path: '/core/loaders/preload',
    name: 'Preload',
    component: PreloadDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Preload',
    description: 'Preload all scene assets.',
  },
  {
    path: '/core/loaders/screenvideotexture',
    name: 'ScreenVideoTexture',
    component: ScreenVideoTextureDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Screen Video Texture',
    description: 'Capture screen as video texture.',
  },
  {
    path: '/core/loaders/trailtexture',
    name: 'TrailTexture',
    component: TrailTextureDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Trail Texture',
    description: 'Dynamic trail texture generation.',
  },
  {
    path: '/core/loaders/usefbx',
    name: 'useFBX',
    component: UseFBXDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'useFBX',
    description: 'Load FBX model files.',
  },
  {
    path: '/core/loaders/usefont',
    name: 'useFont',
    component: UseFontDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'useFont',
    description: 'Load Three.js font files for Text3D.',
  },
  {
    path: '/core/loaders/usegltf',
    name: 'useGLTF',
    component: UseGLTFDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'useGLTF',
    description: 'Load GLTF/GLB model files.',
  },
  {
    path: '/core/loaders/usektx2',
    name: 'useKTX2',
    component: UseKTX2Demo,
    tier: 'core',
    category: 'Loaders',
    title: 'useKTX2',
    description: 'Load compressed KTX2 textures.',
  },
  {
    path: '/core/loaders/useprogress',
    name: 'useProgress',
    component: UseProgressDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'useProgress',
    description: 'Track asset loading progress.',
  },
  {
    path: '/core/loaders/usespriteloader',
    name: 'useSpriteLoader',
    component: UseSpriteLoaderDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'useSpriteLoader',
    description: 'Load sprite textures.',
  },
  {
    path: '/core/loaders/usetexture',
    name: 'useTexture',
    component: UseTextureDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'useTexture',
    description: 'Load image textures.',
  },
  {
    path: '/core/loaders/videotexture',
    name: 'VideoTexture',
    component: VideoTextureDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Video Texture',
    description: 'Use video as texture.',
  },
  {
    path: '/core/loaders/webcamvideotexture',
    name: 'WebcamVideoTexture',
    component: WebcamVideoTextureDemo,
    tier: 'core',
    category: 'Loaders',
    title: 'Webcam Video Texture',
    description: 'Use webcam feed as texture.',
  },

  // Core - Performance
  {
    path: '/core/performance/adaptivedpr',
    name: 'AdaptiveDpr',
    component: AdaptiveDprDemo,
    tier: 'core',
    category: 'Performance',
    title: 'Adaptive DPR',
    description: 'Automatically adjust pixel ratio based on performance.',
  },
  {
    path: '/core/performance/adaptiveevents',
    name: 'AdaptiveEvents',
    component: AdaptiveEventsDemo,
    tier: 'core',
    category: 'Performance',
    title: 'Adaptive Events',
    description: 'Throttle event handling based on performance.',
  },
  {
    path: '/core/performance/detectgpu',
    name: 'DetectGPU',
    component: DetectGPUDemo,
    tier: 'core',
    category: 'Performance',
    title: 'Detect GPU',
    description: 'Detect GPU tier and capabilities.',
  },
  {
    path: '/core/performance/meshbounds',
    name: 'meshBounds',
    component: MeshBoundsDemo,
    tier: 'core',
    category: 'Performance',
    title: 'Mesh Bounds',
    description: 'Faster raycasting using bounding boxes.',
  },
  {
    path: '/core/performance/performancemonitor',
    name: 'PerformanceMonitor',
    component: PerformanceMonitorDemo,
    tier: 'core',
    category: 'Performance',
    title: 'Performance Monitor',
    description: 'Monitor and react to performance changes.',
  },
  {
    path: '/core/performance/stats',
    name: 'Stats',
    component: StatsDemo,
    tier: 'core',
    category: 'Performance',
    title: 'Stats',
    description: 'Display FPS and performance stats.',
  },
  {
    path: '/core/performance/statsgl',
    name: 'StatsGl',
    component: StatsGlDemo,
    tier: 'core',
    category: 'Performance',
    title: 'Stats GL',
    description: 'WebGL-specific performance stats.',
  },

  // Core - Portal
  {
    path: '/core/portal/fisheye',
    name: 'Fisheye',
    component: FisheyeDemo,
    tier: 'core',
    category: 'Portal',
    title: 'Fisheye',
    description: 'Fisheye camera effect.',
  },
  {
    path: '/core/portal/mask',
    name: 'Mask',
    component: MaskDemo,
    tier: 'core',
    category: 'Portal',
    title: 'Mask',
    description: 'Stencil masking for selective rendering.',
  },
  {
    path: '/core/portal/rendertexture',
    name: 'RenderTexture',
    component: RenderTextureDemo,
    tier: 'core',
    category: 'Portal',
    title: 'Render Texture',
    description: 'Render scene to texture.',
  },
  {
    path: '/core/portal/view',
    name: 'View',
    component: ViewDemo,
    tier: 'core',
    category: 'Portal',
    title: 'View',
    description: 'Multiple viewport rendering.',
  },

  // Core - Staging
  {
    path: '/core/staging/backdrop',
    name: 'Backdrop',
    component: BackdropDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Backdrop',
    description: 'Curved backdrop plane for staging.',
  },
  {
    path: '/core/staging/bbanchor',
    name: 'BBAnchor',
    component: BBAnchorDemo,
    tier: 'core',
    category: 'Staging',
    title: 'BB Anchor',
    description: 'Position elements relative to bounding box.',
  },
  {
    path: '/core/staging/bounds',
    name: 'Bounds',
    component: BoundsDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Bounds',
    description: 'Fit camera to object bounds.',
  },
  {
    path: '/core/staging/center',
    name: 'Center',
    component: CenterDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Center',
    description: 'Center geometry at origin.',
  },
  {
    path: '/core/staging/environment',
    name: 'Environment',
    component: EnvironmentDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Environment',
    description: 'Environment maps and lighting.',
  },
  {
    path: '/core/staging/float',
    name: 'Float',
    component: FloatDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Float',
    description: 'Floating animation effect.',
  },
  {
    path: '/core/staging/grid',
    name: 'Grid',
    component: GridDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Grid',
    description: 'Infinite grid helper.',
  },
  {
    path: '/core/staging/lightformer',
    name: 'Lightformer',
    component: LightformerDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Lightformer',
    description: 'Shaped area lights for staging.',
  },
  {
    path: '/core/staging/resize',
    name: 'Resize',
    component: ResizeDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Resize',
    description: 'Responsive resizing container.',
  },
  {
    path: '/core/staging/screensizer',
    name: 'ScreenSizer',
    component: ScreenSizerDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Screen Sizer',
    description: 'Scale based on screen size.',
  },
  {
    path: '/core/staging/shadow',
    name: 'Shadow',
    component: ShadowDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Shadow',
    description: 'Contact shadow effects.',
  },
  {
    path: '/core/staging/sky',
    name: 'Sky',
    component: SkyDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Sky',
    description: 'Procedural sky shader.',
  },
  {
    path: '/core/staging/stage',
    name: 'Stage',
    component: StageDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Stage',
    description: 'Auto-staging with lights and shadows.',
  },
  {
    path: '/core/staging/stars',
    name: 'Stars',
    component: StarsDemo,
    tier: 'core',
    category: 'Staging',
    title: 'Stars',
    description: 'Procedural starfield.',
  },
  {
    path: '/core/staging/useboxprojectedenv',
    name: 'useBoxProjectedEnv',
    component: UseBoxProjectedEnvDemo,
    tier: 'core',
    category: 'Staging',
    title: 'useBoxProjectedEnv',
    description: 'Box-projected environment maps.',
  },
  {
    path: '/core/staging/useenvironment',
    name: 'useEnvironment',
    component: UseEnvironmentDemo,
    tier: 'core',
    category: 'Staging',
    title: 'useEnvironment',
    description: 'Hook for loading environment maps.',
  },

  // Core - UI
  {
    path: '/core/ui/useaspect',
    name: 'useAspect',
    component: UseAspectDemo,
    tier: 'core',
    category: 'UI',
    title: 'useAspect',
    description: 'Maintain aspect ratio scaling.',
  },
  {
    path: '/core/ui/usecursor',
    name: 'useCursor',
    component: UseCursorDemo,
    tier: 'core',
    category: 'UI',
    title: 'useCursor',
    description: 'Change cursor on hover interactions.',
  },
  {
    path: '/core/ui/useintersect',
    name: 'useIntersect',
    component: UseIntersectDemo,
    tier: 'core',
    category: 'UI',
    title: 'useIntersect',
    description: 'Detect when objects intersect viewport.',
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
