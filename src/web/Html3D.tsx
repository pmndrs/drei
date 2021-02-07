import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as THREE from 'three'
import {
  Canvas,
  useThree,
  useFrame,
  extend,
  ReactThreeFiber,
  PointerEvent,
  CanvasProps,
  CanvasContext,
} from 'react-three-fiber'
import { Canvas as CanvasCSS, useFrame as useFrameCSS, CanvasProps as CanvasCSSProps } from 'react-three-fiber/css3d'
import { CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer'

extend({ Css3DObject: CSS3DObject, Css3DSprite: CSS3DSprite })

type css3DObjectProps = ReactThreeFiber.Object3DNode<CSS3DObject, typeof CSS3DObject>
type css3DSpriteProps = ReactThreeFiber.Object3DNode<CSS3DSprite, typeof CSS3DSprite>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      css3DObject: css3DObjectProps
      css3DSprite: css3DSpriteProps
    }
  }
}

export interface Html3DProps extends ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group> {
  sprite?: boolean
  autoClip?: boolean
  ClipComponent?: React.ForwardRefExoticComponent<any>
  cssProps?: css3DObjectProps | css3DSpriteProps
  clipProps?:
    | ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
    | ReactThreeFiber.Object3DNode<THREE.Sprite, typeof THREE.Sprite>
}

export const Html3D = React.forwardRef(
  (
    {
      children,
      sprite = false,
      autoClip = true,
      ClipComponent = ClipMesh,
      cssProps = {},
      clipProps = {},
      ...props
    }: Html3DProps,
    ref: React.Ref<THREE.Group>
  ) => {
    const ctx = useMixedCanvasContext()
    const root = React.useMemo(
      () =>
        Object.assign(document.createElement('div'), {
          className: '__R3F_HTML_ROOT__',
        }),
      []
    )
    React.useEffect(() => {
      ReactDOM.render(<>{children}</>, root)
      resizeObserver.observe(root)
      return () => resizeObserver.unobserve(root)
    }, [children, root])
    return (
      ctx && (
        <group ref={ref} {...props}>
          {React.createElement(`css3D${sprite ? 'Sprite' : 'Object'}`, {
            args: [root],
            scale: new Array(3).fill(1 / ctx.scaleFactor),
            ...cssProps,
          })}
          {autoClip && (
            <ClipComponent
              dom={root}
              rootType={sprite ? 'sprite' : 'mesh'}
              materialType={sprite ? 'sprite' : 'meshPhong'}
              {...clipProps}
            />
          )}
        </group>
      )
    )
  }
)

export interface ClipPropsMesh extends ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh> {
  dom: HTMLElement
  rootType?: 'mesh'
  materialType?: string
}

export interface ClipPropsSprite extends ReactThreeFiber.Object3DNode<THREE.Sprite, typeof THREE.Sprite> {
  dom: HTMLElement
  rootType?: 'sprite'
  materialType?: 'spriteMaterial'
}

export type ClipProps = ClipPropsMesh | ClipPropsSprite

export const ClipMesh = React.forwardRef(
  (
    { dom, rootType = 'mesh', materialType = 'meshPhong', ...props }: ClipProps,
    fRef: React.Ref<THREE.Mesh | THREE.Sprite>
  ) => {
    const ctx = useMixedCanvasContext()
    const iRef = React.useRef()
    const ref = (fRef || iRef) as React.MutableRefObject<THREE.Mesh | THREE.Sprite>
    const { gl } = useThree()
    useFrame(() => {
      const size = resizeMap.get(dom)
      if (size && ref.current && ctx !== null) {
        ref.current.scale.x = size.width / ctx.scaleFactor
        ref.current.scale.y = size.height / ctx.scaleFactor
      }
    })
    return (
      ctx &&
      React.createElement(
        rootType,
        {
          ref,
          ...props,
          onPointerMove: (event: PointerEvent) => {
            // the timeout is to be sure that this is executed AFTER document.onmousemove
            setTimeout(() => setGLPointer(gl, 'none'), 0)
            if (props.onPointerMove) props.onPointerMove(event)
          },
        },
        <planeBufferGeometry args={[1, 1]} />,
        React.createElement(materialType + 'Material', {
          opacity: 0.1,
          color: 'black',
          side: THREE.DoubleSide,
          blending: THREE.NoBlending,
        })
      )
    )
  }
)

export interface MixedCanvasProps extends CanvasProps {
  scaleFactor?: number
  cssProps?: CanvasCSSProps
}

export function MixedCanvas({
  children,
  scaleFactor = 160,
  cssProps = {} as CanvasCSSProps,
  ...props
}: MixedCanvasProps) {
  const [canvasContext, setFromCanvas] = React.useState<CanvasContext | null>(null)
  React.useEffect(() => {
    if (canvasContext) {
      function swapPointer({ target }) {
        if (!target.closest(`.__R3F_HTML_ROOT__`)) setGLPointer((canvasContext as CanvasContext).gl, 'auto')
      }
      document.addEventListener('mousemove', swapPointer)
      return () => document.removeEventListener('mousemove', swapPointer)
    }
  }, [canvasContext])
  return (
    <>
      <Canvas
        {...props}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          ...((props as any).style || {}),
        }}
        onCreated={(ctx: CanvasContext) => {
          ctx.gl.domElement.addEventListener('pointerdown', () => {
            ;(document.getSelection() as Selection).removeAllRanges()
            ;(document.activeElement as HTMLElement).blur()
          })
          setFromCanvas(ctx)
          if (props.onCreated) props.onCreated(ctx)
        }}
      >
        <MixedCanvasProvider value={{ scaleFactor }}>{canvasContext && children}</MixedCanvasProvider>
      </Canvas>
      {canvasContext && (
        <CanvasCSS
          {...cssProps}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            ...((cssProps as any).style || {}),
          }}
        >
          <RenderCSS {...canvasContext} />
        </CanvasCSS>
      )}
    </>
  )
}

const RenderCSS = (ctx: CanvasContext) => (
  useFrameCSS(({ gl }) => (console.log(gl, 'TTEST'), gl.render(ctx.scene, ctx.camera)), 1), null
)

const setGLPointer = (gl: THREE.WebGLRenderer, value: 'auto' | 'none') =>
  ((gl as any).domElement.parentNode.style.pointerEvents = value)

type MixedCanvasType = null | { scaleFactor: number }
const MixedCanvasContext = React.createContext<MixedCanvasType>(null)
const MixedCanvasProvider = MixedCanvasContext.Provider
const useMixedCanvasContext = () =>
  React.useContext(MixedCanvasContext) ||
  (console.error('Html3D can only be used inside a MixedCanvas Component'), null)

type ResizeMapType = { width: number; height: number }
const resizeMap = new WeakMap<HTMLElement, ResizeMapType>()
const resizeObserver = new ResizeObserver((entries) => {
  for (let i = 0; i !== entries.length; i++) {
    const target = entries[i].target as HTMLElement
    let offsets = resizeMap.get(target)
    if (!offsets) {
      offsets = {} as ResizeMapType
      resizeMap.set(target, offsets)
    }
    offsets.width = target.offsetWidth
    offsets.height = target.offsetHeight
  }
})
