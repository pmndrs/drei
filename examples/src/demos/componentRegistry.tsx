//* Component Registry ==============================
// Single source of truth for all drei components, their demos, and status tracking.
// Each conceptual component has ONE entry, with renderer support tracked via columns.

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
import TextDemo from './external/Text'
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
import MeshPortalDemo from './core/portal/MeshPortal'

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
import ContactShadowsDemo from './core/staging/ContactShadows'
import SkyDemo from './core/staging/Sky'
import StageDemo from './core/staging/Stage'
import StarsDemo from './core/staging/Stars'
import UseBoxProjectedEnvDemo from './core/staging/useBoxProjectedEnv'
import UseEnvironmentDemo from './core/staging/useEnvironment'

// Core - UI
import UseAspectDemo from './core/ui/useAspect'
import UseCursorDemo from './core/ui/useCursor'
import UseIntersectDemo from './core/ui/useIntersect'
import MeshTransmissionMaterialDemo from './materials/meshTransmission'

//* Types ==============================

import {
  componentStatus,
  type Classification,
  type ComponentStatus,
  type RendererSupport,
} from '../../../component-status.generated'

export type { Classification, ComponentStatus, RendererSupport }

export type Status = '🟢' | '🟡' | '🔴' | '⚪'

/** A derived boolean rendered in the dashboard's status vocabulary. */
export const statusOf = (present: boolean): Status => (present ? '🟢' : '🔴')

// Categories for grouping - simplified from previous tier system
export type Category =
  | 'Cameras'
  | 'Controls'
  | 'Abstractions'
  | 'Effects'
  | 'Geometry'
  | 'Helpers'
  | 'Loaders'
  | 'Performance'
  | 'Portal'
  | 'Staging'
  | 'UI'
  | 'Materials'
  | 'External'
  | 'Experimental'

/**
 * A registry entry holds only what a human has to write: identity, prose, and
 * which demo to render.
 *
 * Status is NOT here. It used to be — `structure`, `imports`, `types`, `tests`,
 * `rendererSupport`, `legacyStatus`, `webgpuStatus` and `tslConversion` were all
 * typed by hand, and by August 2026 the `tests` field was wrong on 55 of 140
 * entries and `webgpuStatus` on 19 of 33. Status now comes from
 * `component-status.generated.ts`, which is derived from the filesystem.
 *
 * @see statusOf
 */
export interface DreiComponent {
  // Identity
  name: string
  category: Category
  title: string
  description: string

  // Demo routing - path is always present, component only if demo exists
  path: string
  component?: React.ComponentType

  /** Free-text context a human wants to record. Never a status claim. */
  notes: string
}

// Legacy Tier type for backward compatibility with sidebar grouping
export type Tier = 'core' | 'external' | 'experimental'

//* Component Registry ==============================
// One entry per conceptual component. Renderer-specific status tracked in columns.

export const components: DreiComponent[] = [
  //* Cameras ==============================
  {
    name: 'OrthographicCamera',
    category: 'Cameras',
    title: 'Orthographic Camera',
    description: 'A camera that uses an orthographic projection.',
    path: '/core/cameras/orthographic',
    component: OrthographicCameraDemo,
    notes: 'Example created',
  },
  {
    name: 'PerspectiveCamera',
    category: 'Cameras',
    title: 'Perspective Camera',
    description: 'A camera that uses a perspective projection.',
    path: '/core/cameras/perspective',
    component: PerspectiveCameraDemo,
    notes: 'Example created',
  },
  {
    name: 'useCustomRaycast',
    category: 'Cameras',
    title: 'Use Custom Raycast',
    description: 'Hook for custom raycast behavior.',
    path: '/core/cameras/usecustomraycast',
    component: UseCustomRaycastDemo,
    notes: '',
  },
  {
    name: 'CubeCamera',
    category: 'Cameras',
    title: 'Cube Camera',
    description: 'Camera for rendering cube maps / environment captures.',
    path: '/cameras/cubecamera',
    notes: 'Needs WebGPU render target support',
  },

  //* Controls ==============================
  {
    name: 'OrbitControls',
    category: 'Controls',
    title: 'Orbit Controls',
    description: 'A control that allows the camera to orbit around the scene.',
    path: '/core/controls/orbit',
    component: OrbitControlsDemo,
    notes: 'Example created',
  },
  {
    name: 'ArcballControls',
    category: 'Controls',
    title: 'Arcball Controls',
    description: 'A control that allows the camera to orbit around the scene.',
    path: '/core/controls/arcball',
    component: ArcballControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'MapControls',
    category: 'Controls',
    title: 'Map Controls',
    description: 'A control that allows the camera to move around the scene.',
    path: '/core/controls/map',
    component: MapControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'PointerLockControls',
    category: 'Controls',
    title: 'Pointer Lock Controls',
    description: 'A control that allows the camera to lock to the scene.',
    path: '/core/controls/pointerlock',
    component: PointerLockControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'TrackballControls',
    category: 'Controls',
    title: 'Trackball Controls',
    description: 'A control that allows the camera to orbit around the scene.',
    path: '/core/controls/trackball',
    component: TrackballControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'FlyControls',
    category: 'Controls',
    title: 'Fly Controls',
    description: 'A control that allows the camera to fly around the scene.',
    path: '/core/controls/fly',
    component: FlyControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'DeviceOrientationControls',
    category: 'Controls',
    title: 'Device Orientation Controls',
    description: 'Control camera with device orientation (mobile/gyroscope).',
    path: '/core/controls/deviceorientation',
    component: DeviceOrientationControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'DragControls',
    category: 'Controls',
    title: 'Drag Controls',
    description: 'Drag objects in the scene with mouse.',
    path: '/core/controls/drag',
    component: DragControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'FirstPersonControls',
    category: 'Controls',
    title: 'First Person Controls',
    description: 'First-person shooter style camera controls.',
    path: '/core/controls/firstperson',
    component: FirstPersonControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'KeyboardControls',
    category: 'Controls',
    title: 'Keyboard Controls',
    description: 'Keyboard input management for scene interactions.',
    path: '/core/controls/keyboard',
    component: KeyboardControlsDemo,
    notes: '',
  },
  {
    name: 'PivotControls',
    category: 'Controls',
    title: 'Pivot Controls',
    description: 'Transform gizmo for moving, rotating, and scaling objects.',
    path: '/core/controls/pivot',
    component: PivotControlsDemo,
    notes: 'Multi-file component',
  },
  {
    name: 'TransformControls',
    category: 'Controls',
    title: 'Transform Controls',
    description: 'Three.js TransformControls for precise object manipulation.',
    path: '/core/controls/transform',
    component: TransformControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'MotionPathControls',
    category: 'Controls',
    title: 'Motion Path Controls',
    description: 'Animate camera along a curved path.',
    path: '/core/controls/motionpath',
    component: MotionPathControlsDemo,
    notes: '',
  },
  {
    name: 'PresentationControls',
    category: 'Controls',
    title: 'Presentation Controls',
    description: 'Drag-to-rotate controls ideal for product showcases.',
    path: '/core/controls/presentation',
    component: PresentationControlsDemo,
    notes: '',
  },
  {
    name: 'FaceControls',
    category: 'Controls',
    title: 'Face Controls',
    description: 'Control camera with face tracking (requires webcam and MediaPipe).',
    path: '/core/controls/face',
    component: FaceControlsDemo,
    notes: 'Cross-tier imports',
  },
  {
    name: 'Select',
    category: 'Controls',
    title: 'Select',
    description: 'Click and box-select objects in the scene.',
    path: '/core/controls/select',
    component: SelectDemo,
    notes: '',
  },
  {
    name: 'ScrollControls',
    category: 'Controls',
    title: 'Scroll Controls',
    description: 'Create scroll-based animations and interactions.',
    path: '/core/controls/scroll',
    component: ScrollControlsDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'GizmoHelper',
    category: 'Controls',
    title: 'Gizmo Helper',
    description: 'Visual orientation helper showing scene axes.',
    path: '/core/controls/gizmo',
    component: GizmoHelperDemo,
    notes: 'Case sensitivity, cross-tier',
  },
  {
    name: 'GizmoViewport',
    category: 'Controls',
    title: 'Gizmo Viewport',
    description: 'Viewport-style orientation gizmo.',
    path: '/core/controls/gizmoviewport',
    notes: '',
  },
  {
    name: 'GizmoViewcube',
    category: 'Controls',
    title: 'Gizmo Viewcube',
    description: 'Viewcube-style orientation gizmo.',
    path: '/core/controls/gizmoviewcube',
    notes: '',
  },

  //* Abstractions ==============================
  {
    name: 'AsciiRenderer',
    category: 'Abstractions',
    title: 'ASCII Renderer',
    description: 'Render the 3D scene as ASCII art characters.',
    path: '/core/abstractions/asciirenderer',
    component: AsciiRendererDemo,
    notes: '',
  },
  {
    name: 'Billboard',
    category: 'Abstractions',
    title: 'Billboard',
    description: 'Objects that always face the camera.',
    path: '/core/abstractions/billboard',
    component: BillboardDemo,
    notes: '',
  },
  {
    name: 'Clone',
    category: 'Abstractions',
    title: 'Clone',
    description: 'Clone and reuse geometries and materials.',
    path: '/core/abstractions/clone',
    component: CloneDemo,
    notes: 'Type issues',
  },
  {
    name: 'ComputedAttribute',
    category: 'Abstractions',
    title: 'Computed Attribute',
    description: 'Dynamically computed geometry attributes.',
    path: '/core/abstractions/computedattribute',
    component: ComputedAttributeDemo,
    notes: 'Unused @ts-expect-error',
  },
  {
    name: 'Example',
    category: 'Abstractions',
    title: 'Example',
    description: 'Example counter component demonstration.',
    path: '/core/abstractions/example',
    component: ExampleDemo,
    notes: 'Cross-component imports',
  },
  {
    name: 'Instances',
    category: 'Abstractions',
    title: 'Instances',
    description: 'Efficient instanced rendering for many objects.',
    path: '/core/abstractions/instances',
    component: InstancesDemo,
    notes: 'Type issues',
  },
  {
    name: 'Sampler',
    category: 'Abstractions',
    title: 'Sampler',
    description: 'Sample points on mesh surfaces.',
    path: '/core/abstractions/sampler',
    component: SamplerDemo,
    notes: '',
  },
  {
    name: 'ScreenSpace',
    category: 'Abstractions',
    title: 'Screen Space',
    description: 'Render objects in screen space coordinates.',
    path: '/core/abstractions/screenspace',
    component: ScreenSpaceDemo,
    notes: '',
  },
  {
    name: 'Svg',
    category: 'Abstractions',
    title: 'SVG',
    description: 'Render SVG graphics in 3D space.',
    path: '/core/abstractions/svg',
    component: SvgDemo,
    notes: '',
  },
  {
    name: 'Effects',
    category: 'Abstractions',
    title: 'Effects',
    description: 'Post-processing effects wrapper.',
    path: '/abstractions/effects',
    notes: 'Needs TSL shader conversion',
  },

  //* Effects ==============================
  {
    name: 'CameraShake',
    category: 'Effects',
    title: 'Camera Shake',
    description: 'Add camera shake effects for impact and motion.',
    path: '/core/effects/camerashake',
    component: CameraShakeDemo,
    notes: 'Utils import issue',
  },
  {
    name: 'Cloud',
    category: 'Effects',
    title: 'Cloud',
    description: 'Volumetric cloud effects.',
    path: '/core/effects/cloud',
    component: CloudDemo,
    notes: 'Cross-component imports',
  },
  {
    name: 'Sparkles',
    category: 'Effects',
    title: 'Sparkles',
    description: 'Particle sparkle effects.',
    path: '/core/effects/sparkles',
    component: SparklesDemo,
    notes: '',
  },

  //* Geometry ==============================
  {
    name: 'CatmullRomLine',
    category: 'Geometry',
    title: 'Catmull-Rom Line',
    description: 'Smooth Catmull-Rom curve lines.',
    path: '/core/geometry/catmullromline',
    component: CatmullRomLineDemo,
    notes: '',
  },
  {
    name: 'CubicBezierLine',
    category: 'Geometry',
    title: 'Cubic Bezier Line',
    description: 'Cubic Bezier curve lines.',
    path: '/core/geometry/cubicbezierline',
    component: CubicBezierLineDemo,
    notes: '',
  },
  {
    name: 'CurveModifier',
    category: 'Geometry',
    title: 'Curve Modifier',
    description: 'Deform geometry along a curve path.',
    path: '/core/geometry/curvemodifier',
    component: CurveModifierDemo,
    notes: '',
  },
  {
    name: 'Decal',
    category: 'Geometry',
    title: 'Decal',
    description: 'Project decals onto mesh surfaces.',
    path: '/core/geometry/decal',
    component: DecalDemo,
    notes: '',
  },
  {
    name: 'Detailed',
    category: 'Geometry',
    title: 'Detailed',
    description: 'Level of detail (LOD) system for optimization. (Zoom in to see the effect)',
    path: '/core/geometry/detailed',
    component: DetailedDemo,
    notes: '',
  },
  {
    name: 'Edges',
    category: 'Geometry',
    title: 'Edges',
    description: 'Render mesh edges with customizable appearance.',
    path: '/core/geometry/edges',
    component: EdgesDemo,
    notes: 'Might Check for imports',
  },
  {
    name: 'Line',
    category: 'Geometry',
    title: 'Line',
    description: 'Render lines in 3D space.',
    path: '/core/geometry/line',
    component: LineDemo,
    notes: '',
  },
  {
    name: 'Points',
    category: 'Geometry',
    title: 'Points',
    description: 'Point cloud rendering.',
    path: '/core/geometry/points',
    component: PointsDemo,
    notes: '',
  },
  {
    name: 'QuadraticBezierLine',
    category: 'Geometry',
    title: 'Quadratic Bezier Line',
    description: 'Quadratic Bezier curve lines.',
    path: '/core/geometry/quadraticbezierline',
    component: QuadraticBezierLineDemo,
    notes: '',
  },
  {
    name: 'RoundedBox',
    category: 'Geometry',
    title: 'Rounded Box',
    description: 'Box geometry with rounded edges.',
    path: '/core/geometry/roundedbox',
    component: RoundedBoxDemo,
    notes: '',
  },
  {
    name: 'ScreenQuad',
    category: 'Geometry',
    title: 'Screen Quad',
    description: 'Fullscreen quad for post-processing effects.',
    path: '/core/geometry/screenquad',
    component: ScreenQuadDemo,
    notes: '',
  },
  {
    name: 'Segments',
    category: 'Geometry',
    title: 'Segments',
    description: 'Individual line segments with colors and styles.',
    path: '/core/geometry/segments',
    component: SegmentsDemo,
    notes: '',
  },
  {
    name: 'Text3D',
    category: 'Geometry',
    title: 'Text3D',
    description: '3D text geometry with extrusion.',
    path: '/core/geometry/text3d',
    component: Text3DDemo,
    notes: '',
  },
  {
    name: 'Trail',
    category: 'Geometry',
    title: 'Trail',
    description: 'Motion trail effects for moving objects.',
    path: '/core/geometry/trail',
    component: TrailDemo,
    notes: 'switched from meshline, needs update for width',
  },
  {
    name: 'Wireframe',
    category: 'Geometry',
    title: 'Wireframe',
    description: 'Wireframe rendering for meshes.',
    path: '/core/geometry/wireframe',
    component: WireframeDemo,
    notes: 'Incorrectly in core',
  },
  {
    name: 'Shapes',
    category: 'Geometry',
    title: 'Shapes',
    description: 'Declarative wrappers for the built-in three.js geometries.',
    path: '/core/geometry/shapes',
    notes: '',
  },

  //* Helpers ==============================
  {
    name: 'CycleRaycast',
    category: 'Helpers',
    title: 'Cycle Raycast',
    description: 'Cycle through overlapping raycasted objects.',
    path: '/core/helpers/cycleraycast',
    component: CycleRaycastDemo,
    notes: '',
  },
  {
    name: 'Fbo',
    category: 'Helpers',
    title: 'FBO / useFBO',
    description: 'Framebuffer object helper for render targets.',
    path: '/helpers/fbo',
    component: FboDemo,
    notes: 'Needs WebGPU render target support',
  },
  {
    name: 'Html',
    category: 'Helpers',
    title: 'HTML',
    description: 'Overlay HTML content on 3D objects.',
    path: '/core/helpers/html',
    component: HtmlDemo,
    notes: '',
  },
  {
    name: 'PointMaterial',
    category: 'Helpers',
    title: 'Point Material',
    description: 'Material helper for point rendering.',
    path: '/core/helpers/pointmaterial',
    component: PointMaterialDemo,
    notes: 'very small on webgpu, needs concept refactor',
  },
  {
    name: 'PositionalAudio',
    category: 'Helpers',
    title: 'Positional Audio',
    description: '3D positional audio in space.',
    path: '/core/helpers/positionalaudio',
    component: PositionalAudioDemo,
    notes: '',
  },
  {
    name: 'SpriteAnimator',
    category: 'Helpers',
    title: 'Sprite Animator',
    description: 'Animate sprite sheets.',
    path: '/core/helpers/spriteanimator',
    component: SpriteAnimatorDemo,
    notes: 'SOmething weird with framecount/setup',
  },
  {
    name: 'Text',
    category: 'Helpers',
    title: 'Text',
    description: '2D text rendering with Troika.',
    path: '/core/helpers/text',
    component: TextDemo,
    notes: '',
  },
  {
    name: 'useAnimations',
    category: 'Helpers',
    title: 'useAnimations',
    description: 'Hook for managing GLTF animations.',
    path: '/core/helpers/useanimations',
    component: UseAnimationsDemo,
    notes: '',
  },
  {
    name: 'useContextBridge',
    category: 'Helpers',
    title: 'useContextBridge',
    description: 'Bridge React contexts across portals.',
    path: '/core/helpers/usecontextbridge',
    component: UseContextBridgeDemo,
    notes: '',
  },
  {
    name: 'useHelper',
    category: 'Helpers',
    title: 'useHelper',
    description: 'Attach Three.js helpers to objects.',
    path: '/core/helpers/usehelper',
    notes: '',
  },
  {
    name: 'useDepthBuffer',
    category: 'Helpers',
    title: 'useDepthBuffer',
    description: 'Renders the scene depth into a render target for other effects to sample.',
    path: '/core/helpers/usedepthbuffer',
    notes: '',
  },

  //* Loaders ==============================
  {
    name: 'CubeTexture',
    category: 'Loaders',
    title: 'Cube Texture',
    description: 'Load cube map textures for environments.',
    path: '/core/loaders/cubetexture',
    component: CubeTextureDemo,
    notes: '',
  },
  {
    name: 'Loader',
    category: 'Loaders',
    title: 'Loader',
    description: 'Loading UI component.',
    path: '/core/loaders/loader',
    component: LoaderDemo,
    notes: '',
  },
  {
    name: 'MatcapTexture',
    category: 'Loaders',
    title: 'Matcap Texture',
    description: 'Load matcap textures for materials.',
    path: '/core/loaders/matcaptexture',
    component: MatcapTextureDemo,
    notes: '',
  },
  {
    name: 'Preload',
    category: 'Loaders',
    title: 'Preload',
    description: 'Preload all scene assets.',
    path: '/core/loaders/preload',
    component: PreloadDemo,
    notes: '',
  },
  {
    name: 'ScreenVideoTexture',
    category: 'Loaders',
    title: 'Screen Video Texture',
    description: 'Capture screen as video texture.',
    path: '/core/loaders/screenvideotexture',
    component: ScreenVideoTextureDemo,
    notes: '',
  },
  {
    name: 'TrailTexture',
    category: 'Loaders',
    title: 'Trail Texture',
    description: 'Dynamic trail texture generation.',
    path: '/core/loaders/trailtexture',
    component: TrailTextureDemo,
    notes: '',
  },
  {
    name: 'useFBX',
    category: 'Loaders',
    title: 'useFBX',
    description: 'Load FBX model files.',
    path: '/core/loaders/usefbx',
    component: UseFBXDemo,
    notes: '',
  },
  {
    name: 'useFont',
    category: 'Loaders',
    title: 'useFont',
    description: 'Load Three.js font files for Text3D.',
    path: '/core/loaders/usefont',
    component: UseFontDemo,
    notes: '',
  },
  {
    name: 'useGLTF',
    category: 'Loaders',
    title: 'useGLTF',
    description: 'Load GLTF/GLB model files.',
    path: '/core/loaders/usegltf',
    component: UseGLTFDemo,
    notes: '',
  },
  {
    name: 'useKTX2',
    category: 'Loaders',
    title: 'useKTX2',
    description: 'Load compressed KTX2 textures.',
    path: '/core/loaders/usektx2',
    component: UseKTX2Demo,
    notes: '',
  },
  {
    name: 'useProgress',
    category: 'Loaders',
    title: 'useProgress',
    description: 'Track asset loading progress.',
    path: '/core/loaders/useprogress',
    component: UseProgressDemo,
    notes: '',
  },
  {
    name: 'useSpriteLoader',
    category: 'Loaders',
    title: 'useSpriteLoader',
    description: 'Load sprite textures.',
    path: '/core/loaders/usespriteloader',
    component: UseSpriteLoaderDemo,
    notes: '',
  },
  {
    name: 'useTexture',
    category: 'Loaders',
    title: 'useTexture',
    description: 'Load image textures.',
    path: '/core/loaders/usetexture',
    component: UseTextureDemo,
    notes: '',
  },
  {
    name: 'VideoTexture',
    category: 'Loaders',
    title: 'Video Texture',
    description: 'Use video as texture.',
    path: '/core/loaders/videotexture',
    component: VideoTextureDemo,
    notes: '',
  },
  {
    name: 'WebcamVideoTexture',
    category: 'Loaders',
    title: 'Webcam Video Texture',
    description: 'Use webcam feed as texture.',
    path: '/core/loaders/webcamvideotexture',
    component: WebcamVideoTextureDemo,
    notes: '',
  },
  {
    name: 'useVariants',
    category: 'Loaders',
    title: 'useVariants',
    description: 'Switch between KHR_materials_variants material sets on a loaded glTF.',
    path: '/core/loaders/usevariants',
    notes: '',
  },

  //* Performance ==============================
  {
    name: 'AdaptiveDpr',
    category: 'Performance',
    title: 'Adaptive DPR',
    description: 'Automatically adjust pixel ratio based on performance.',
    path: '/core/performance/adaptivedpr',
    component: AdaptiveDprDemo,
    notes: '',
  },
  {
    name: 'AdaptiveEvents',
    category: 'Performance',
    title: 'Adaptive Events',
    description: 'Throttle event handling based on performance.',
    path: '/core/performance/adaptiveevents',
    component: AdaptiveEventsDemo,
    notes: '',
  },
  {
    name: 'DetectGPU',
    category: 'Performance',
    title: 'Detect GPU',
    description: 'Detect GPU tier and capabilities.',
    path: '/core/performance/detectgpu',
    component: DetectGPUDemo,
    notes: '',
  },
  {
    name: 'meshBounds',
    category: 'Performance',
    title: 'Mesh Bounds',
    description: 'Faster raycasting using bounding boxes.',
    path: '/core/performance/meshbounds',
    component: MeshBoundsDemo,
    notes: '',
  },
  {
    name: 'PerformanceMonitor',
    category: 'Performance',
    title: 'Performance Monitor',
    description: 'Monitor and react to performance changes.',
    path: '/core/performance/performancemonitor',
    component: PerformanceMonitorDemo,
    notes: '',
  },
  {
    name: 'Stats',
    category: 'Performance',
    title: 'Stats',
    description: 'Display FPS and performance stats.',
    path: '/core/performance/stats',
    component: StatsDemo,
    notes: '',
  },
  {
    name: 'StatsGl',
    category: 'Performance',
    title: 'Stats GL',
    description: 'WebGL-specific performance stats.',
    path: '/core/performance/statsgl',
    component: StatsGlDemo,
    notes: '',
  },

  {
    name: 'Inspector',
    category: 'Performance',
    title: 'Three.js Inspector',
    description: 'Profile WebGPU rendering and edit scene parameters with Three.js Inspector.',
    path: '/core/performance/inspector',
    notes: 'R3F v10. Examples are available in Storybook under Performance/Inspector.',
  },

  //* Portal ==============================
  {
    name: 'Fisheye',
    category: 'Portal',
    title: 'Fisheye',
    description: 'Fisheye camera effect.',
    path: '/core/portal/fisheye',
    component: FisheyeDemo,
    notes: '',
  },
  {
    name: 'Hud',
    category: 'Portal',
    title: 'HUD',
    description: 'Heads-up display overlay.',
    path: '/portal/hud',
    notes: 'Needs WebGPU render target support',
  },
  {
    name: 'Mask',
    category: 'Portal',
    title: 'Mask',
    description: 'Stencil masking for selective rendering.',
    path: '/core/portal/mask',
    component: MaskDemo,
    notes: '',
  },
  {
    name: 'RenderCubeTexture',
    category: 'Portal',
    title: 'Render Cube Texture',
    description: 'Render scene to cube texture.',
    path: '/portal/rendercubetexture',
    notes: 'Needs WebGPU render target support',
  },
  {
    name: 'RenderTexture',
    category: 'Portal',
    title: 'Render Texture',
    description: 'Render scene to texture.',
    path: '/core/portal/rendertexture',
    component: RenderTextureDemo,
    notes: 'Needs WebGPU render target support',
  },
  {
    name: 'View',
    category: 'Portal',
    title: 'View',
    description: 'Multiple viewport rendering.',
    path: '/core/portal/view',
    component: ViewDemo,
    notes: '',
  },
  {
    // `name` is the join key into component-status.generated.ts, so it has to be
    // the component's real name. `title` is what the dashboard displays.
    name: 'MeshPortalMaterial',
    category: 'Portal',
    title: 'Mesh Portal',
    description: 'Portal effect through mesh.',
    path: '/core/portal/meshportal',
    component: MeshPortalDemo,
    notes: '',
  },

  //* Staging ==============================
  {
    name: 'Backdrop',
    category: 'Staging',
    title: 'Backdrop',
    description: 'Curved backdrop plane for staging.',
    path: '/core/staging/backdrop',
    component: BackdropDemo,
    notes: '',
  },
  {
    name: 'BBAnchor',
    category: 'Staging',
    title: 'BB Anchor',
    description: 'Position elements relative to bounding box.',
    path: '/core/staging/bbanchor',
    component: BBAnchorDemo,
    notes: '',
  },
  {
    name: 'Bounds',
    category: 'Staging',
    title: 'Bounds',
    description: 'Fit camera to object bounds.',
    path: '/core/staging/bounds',
    component: BoundsDemo,
    notes: '',
  },
  {
    name: 'Center',
    category: 'Staging',
    title: 'Center',
    description: 'Center geometry at origin.',
    path: '/core/staging/center',
    component: CenterDemo,
    notes: '',
  },
  {
    name: 'Environment',
    category: 'Staging',
    title: 'Environment',
    description: 'Environment maps and lighting.',
    path: '/core/staging/environment',
    component: EnvironmentDemo,
    notes: '',
  },
  {
    name: 'Float',
    category: 'Staging',
    title: 'Float',
    description: 'Floating animation effect.',
    path: '/core/staging/float',
    component: FloatDemo,
    notes: '',
  },
  {
    name: 'Grid',
    category: 'Staging',
    title: 'Grid',
    description: 'Infinite grid helper.',
    path: '/core/staging/grid',
    component: GridDemo,
    notes: '',
  },
  {
    name: 'Lightformer',
    category: 'Staging',
    title: 'Lightformer',
    description: 'Shaped area lights for staging.',
    path: '/core/staging/lightformer',
    component: LightformerDemo,
    notes: '',
  },
  {
    name: 'Resize',
    category: 'Staging',
    title: 'Resize',
    description: 'Responsive resizing container.',
    path: '/core/staging/resize',
    component: ResizeDemo,
    notes: '',
  },
  {
    name: 'ScreenSizer',
    category: 'Staging',
    title: 'Screen Sizer',
    description: 'Scale based on screen size.',
    path: '/core/staging/screensizer',
    component: ScreenSizerDemo,
    notes: '',
  },
  {
    name: 'Shadow',
    category: 'Staging',
    title: 'Shadow',
    description: 'Contact shadow effects.',
    path: '/core/staging/shadow',
    component: ShadowDemo,
    notes: '',
  },
  {
    name: 'Sky',
    category: 'Staging',
    title: 'Sky',
    description: 'Procedural sky shader.',
    path: '/core/staging/sky',
    component: SkyDemo,
    notes: '',
  },
  {
    name: 'SpotLight',
    category: 'Staging',
    title: 'SpotLight',
    description: 'Enhanced spotlight with volumetric effects.',
    path: '/core/staging/spotlight',
    notes: '',
  },
  {
    name: 'Stage',
    category: 'Staging',
    title: 'Stage',
    description: 'Auto-staging with lights and shadows.',
    path: '/core/staging/stage',
    component: StageDemo,
    notes: '',
  },
  {
    name: 'Stars',
    category: 'Staging',
    title: 'Stars',
    description: 'Procedural starfield.',
    path: '/core/staging/stars',
    component: StarsDemo,
    notes: '',
  },
  {
    name: 'useBoxProjectedEnv',
    category: 'Staging',
    title: 'useBoxProjectedEnv',
    description: 'Box-projected environment maps.',
    path: '/core/staging/useboxprojectedenv',
    component: UseBoxProjectedEnvDemo,
    notes: '',
  },
  {
    name: 'useEnvironment',
    category: 'Staging',
    title: 'useEnvironment',
    description: 'Hook for loading environment maps.',
    path: '/core/staging/useenvironment',
    component: UseEnvironmentDemo,
    notes: '',
  },
  {
    name: 'ShadowAlpha',
    category: 'Staging',
    title: 'Shadow Alpha',
    description: "Carries a material's alpha into the shadow it casts.",
    path: '/staging/shadowalpha',
    notes: "Legacy only — patches the depth material's GLSL via onBeforeCompile, which TSL has no equivalent for.",
  },

  //* UI ==============================
  {
    name: 'useAspect',
    category: 'UI',
    title: 'useAspect',
    description: 'Maintain aspect ratio scaling.',
    path: '/core/ui/useaspect',
    component: UseAspectDemo,
    notes: '',
  },
  {
    name: 'useCursor',
    category: 'UI',
    title: 'useCursor',
    description: 'Change cursor on hover interactions.',
    path: '/core/ui/usecursor',
    component: UseCursorDemo,
    notes: '',
  },
  {
    name: 'useIntersect',
    category: 'UI',
    title: 'useIntersect',
    description: 'Detect when objects intersect viewport.',
    path: '/core/ui/useintersect',
    component: UseIntersectDemo,
    notes: '',
  },

  //* Materials (Dual renderer - need both legacy and WebGPU) ==============================
  {
    name: 'AccumulativeShadows',
    category: 'Materials',
    title: 'Accumulative Shadows',
    description: 'Soft accumulative shadow ground.',
    path: '/materials/accumulativeshadows',
    notes: 'High priority for WebGPU',
  },
  {
    name: 'MeshTransmissionMaterial',
    category: 'Materials',
    title: 'Mesh Transmission Material',
    description: 'Glass-like transmission material.',
    path: '/materials/meshtransmissionmaterial',
    component: MeshTransmissionMaterialDemo,
    notes: 'High priority for WebGPU',
  },
  {
    name: 'BakeShadows',
    category: 'Materials',
    title: 'Bake Shadows',
    description: 'Bake shadows to texture.',
    path: '/materials/bakeshadows',
    notes: 'Medium priority',
  },
  {
    name: 'BlurPass',
    category: 'Materials',
    title: 'Blur Pass',
    description: 'Gaussian blur post-processing.',
    path: '/materials/blurpass',
    notes: 'Medium priority',
  },
  {
    name: 'Caustics',
    category: 'Materials',
    title: 'Caustics',
    description: 'Light caustics effect.',
    path: '/materials/caustics',
    notes: 'High priority for WebGPU',
  },
  {
    name: 'ContactShadows',
    category: 'Materials',
    title: 'Contact Shadows',
    description: 'Soft contact shadows.',
    path: '/core/staging/contactshadows',
    component: ContactShadowsDemo,
    notes: 'TSL partial: opacity/blur work, color prop needs rewrite (uses multiply blend workaround)',
  },
  {
    name: 'ConvolutionMaterial',
    category: 'Materials',
    title: 'Convolution Material',
    description: 'Convolution blur material.',
    path: '/materials/convolutionmaterial',
    notes: 'Low priority',
  },
  {
    name: 'DiscardMaterial',
    category: 'Materials',
    title: 'Discard Material',
    description: 'Material that discards all fragments.',
    path: '/materials/discardmaterial',
    notes: 'Low priority',
  },
  {
    name: 'GradientTexture',
    category: 'Materials',
    title: 'Gradient Texture',
    description: 'Procedural gradient texture.',
    path: '/materials/gradienttexture',
    notes: 'Medium priority',
  },
  {
    name: 'Image',
    category: 'Materials',
    title: 'Image',
    description: 'Image plane with shader effects.',
    path: '/materials/image',
    notes: 'High priority',
  },
  {
    name: 'MeshDiscardMaterial',
    category: 'Materials',
    title: 'Mesh Discard Material',
    description: 'Material that discards mesh fragments.',
    path: '/materials/meshdiscardmaterial',
    notes: 'Low priority',
  },
  {
    name: 'HtmlMaterial',
    category: 'Materials',
    title: 'Html Material',
    description: 'Material used by Html occlusion to blend DOM content into the scene.',
    path: '/materials/htmlmaterial',
    notes: 'Internal to Html occlude="blending", but exported from both entries.',
  },
  {
    name: 'MeshDistortMaterial',
    category: 'Materials',
    title: 'Mesh Distort Material',
    description: 'Noise-based vertex distortion.',
    path: '/materials/meshdistortmaterial',
    notes: 'High priority',
  },
  {
    name: 'MeshReflectorMaterial',
    category: 'Materials',
    title: 'Mesh Reflector Material',
    description: 'Planar reflections.',
    path: '/materials/meshreflectormaterial',
    notes: 'High priority',
  },
  {
    name: 'MeshRefractionMaterial',
    category: 'Materials',
    title: 'Mesh Refraction Material',
    description: 'Refraction through glass-like materials.',
    path: '/materials/meshrefractionmaterial',
    notes: 'High priority',
  },
  {
    name: 'MeshWobbleMaterial',
    category: 'Materials',
    title: 'Mesh Wobble Material',
    description: 'Wobbly animated material.',
    path: '/materials/meshwobblematerial',
    notes: 'Medium priority',
  },
  {
    name: 'Outlines',
    category: 'Materials',
    title: 'Outlines',
    description: 'Mesh outline effect.',
    path: '/materials/outlines',
    notes: 'Medium priority',
  },
  {
    name: 'shaderMaterial',
    category: 'Materials',
    title: 'Shader Material',
    description: 'Custom shader material factory.',
    path: '/materials/shadermaterial',
    notes: 'High priority - core utility',
  },
  {
    name: 'SoftShadows',
    category: 'Materials',
    title: 'Soft Shadows',
    description: 'Percentage closer soft shadows.',
    path: '/materials/softshadows',
    notes: 'Medium priority',
  },
  {
    name: 'SpotLightMaterial',
    category: 'Materials',
    title: 'SpotLight Material',
    description: 'Volumetric spotlight material.',
    path: '/materials/spotlightmaterial',
    notes: 'Medium priority',
  },
  {
    name: 'WireframeMaterial',
    category: 'Materials',
    title: 'Wireframe Material',
    description: 'Stylized wireframe material.',
    path: '/materials/wireframematerial',
    notes: 'Low priority',
  },

  //* External ==============================
  {
    name: 'Bvh',
    category: 'External',
    title: 'BVH',
    description: 'Bounding Volume Hierarchy for fast raycasting.',
    path: '/external/bvh',
    notes: '',
  },
  {
    name: 'CameraControls',
    category: 'External',
    title: 'Camera Controls',
    description: 'Advanced camera controls library.',
    path: '/external/cameracontrols',
    notes: '',
  },
  {
    name: 'Facemesh',
    category: 'External',
    title: 'Facemesh',
    description: 'MediaPipe face mesh integration.',
    path: '/external/facemesh',
    notes: '',
  },
  {
    name: 'FaceLandmarker',
    category: 'External',
    title: 'Face Landmarker',
    description: 'MediaPipe face landmark detection.',
    path: '/external/facelandmarker',
    notes: '',
  },
  {
    name: 'NormalTexture',
    category: 'External',
    title: 'Normal Texture',
    description: 'Generate normal maps from images.',
    path: '/external/normaltexture',
    notes: '',
  },
  {
    name: 'Splat',
    category: 'External',
    title: 'Splat',
    description: 'Gaussian splatting renderer.',
    path: '/external/splat',
    notes: '',
  },

  //* Experimental ==============================
  {
    name: 'MarchingCubes',
    category: 'Experimental',
    title: 'Marching Cubes',
    description: 'Marching cubes isosurface extraction.',
    path: '/experimental/marchingcubes',
    notes: 'Utils import, type issues',
  },
]

//* Helper Functions ==============================

// Get all components that have working demos
export const getDemos = () => components.filter((c) => c.component !== undefined)

/**
 * A registry entry joined to its derived status. `known` is false when the audit
 * has no record of the name — which means the registry and the filesystem have
 * diverged, and the dashboard should say so rather than render a confident zero.
 */
export type ComponentView = DreiComponent &
  Omit<ComponentStatus, 'name' | 'category'> & {
    known: boolean
  }

const UNKNOWN: Omit<ComponentStatus, 'name' | 'category'> = {
  classification: 'agnostic',
  rendererSupport: 'unknown',
  story: false,
  test: false,
  testAsserts: false,
  docs: false,
  legacy: false,
  webgpu: false,
  webgpuStory: false,
  webgpuExercised: false,
  webgpuIsCopy: false,
  legacyStory: false,
  assignee: null,
  reason: null,
}

/** Join a registry entry to the generated status. */
export const viewOf = (entry: DreiComponent): ComponentView => {
  const derived = componentStatus[entry.name]
  const { name: _n, category: _c, ...rest } = derived ?? { name: '', category: '', ...UNKNOWN }
  return { ...entry, ...rest, known: derived !== undefined }
}

/** Every registry entry with its derived status. */
export const componentViews = (): ComponentView[] => components.map(viewOf)

// Get component by name (for ExampleCard, etc.)
export const getComponent = (name: string): ComponentView => {
  const component = components.find((c) => c.name === name)
  if (!component) throw new Error(`Component ${name} not found`)
  return viewOf(component)
}

// Alias for backward compatibility
export const getMetadata = getComponent

// Check if a component has a demo
export const hasDemo = (name: string) => {
  const component = components.find((c) => c.name === name)
  return component?.component !== undefined
}

// Get components by category
export const getByCategory = (category: Category) => components.filter((c) => c.category === category)

// Get components by renderer support type
export const getByRendererSupport = (support: RendererSupport) =>
  componentViews().filter((c) => c.rendererSupport === support)

// Components that have a legacy implementation but no WebGPU one.
// `webgpu` means the file exists — not that it works. See #2801.
export const getWebGPUTodo = () => componentViews().filter((c) => c.legacy && !c.webgpu)

// Derive tier from category for backward compatibility with sidebar
export const getTier = (c: DreiComponent): Tier => {
  if (c.category === 'External') return 'external'
  if (c.category === 'Experimental') return 'experimental'
  return 'core'
}

// Backward compatibility: Demo type alias
export type Demo = DreiComponent & { component: React.ComponentType }

// Backward compatibility: demos array (only components with demos)
export const demos = getDemos() as Demo[]
