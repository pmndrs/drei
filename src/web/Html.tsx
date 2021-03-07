import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Vector3, Group, Object3D, Matrix4, Camera, PerspectiveCamera, OrthographicCamera } from 'three'
import { Assign } from 'utility-types'
import { ReactThreeFiber, useFrame, useThree } from 'react-three-fiber'

const v1 = new Vector3()
const v2 = new Vector3()
const v3 = new Vector3()

function defaultCalculatePosition(el: Object3D, camera: Camera, size: { width: number; height: number }) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  objectPos.project(camera)
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf]
}

export type CalculatePosition = typeof defaultCalculatePosition

function isObjectBehindCamera(el: Object3D, camera: Camera) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
  const deltaCamObj = objectPos.sub(cameraPos)
  const camDir = camera.getWorldDirection(v3)
  return deltaCamObj.angleTo(camDir) > Math.PI / 2
}

function objectScale(el: Object3D, camera: Camera) {
  if (camera instanceof OrthographicCamera) {
    return camera.zoom
  } else if (camera instanceof PerspectiveCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
    const vFOV = (camera.fov * Math.PI) / 180
    const dist = objectPos.distanceTo(cameraPos)
    const scaleFOV = 2 * Math.tan(vFOV / 2) * dist
    return 1 / scaleFOV
  } else {
    return 1
  }
}

function objectZIndex(el: Object3D, camera: Camera, zIndexRange: Array<number>) {
  if (camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
    const dist = objectPos.distanceTo(cameraPos)
    const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near)
    const B = zIndexRange[1] - A * camera.far
    return Math.round(A * dist + B)
  }
  return undefined
}

const epsilon = (value: number) => (Math.abs(value) < 1e-10 ? 0 : value)

function getCSSMatrix(matrix: Matrix4, multipliers: number[], prepend = '') {
  let matrix3d = 'matrix3d('
  for (let i = 0; i !== 16; i++) {
    matrix3d += epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? ',' : ')')
  }
  return prepend + matrix3d
}

const getCameraCSSMatrix = ((multipliers: number[]) => {
  return (matrix: Matrix4) => getCSSMatrix(matrix, multipliers)
})([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1])

const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
  return (matrix: Matrix4, factor: number) => getCSSMatrix(matrix, scaleMultipliers(factor), 'translate(-50%,-50%)')
})((f: number) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1])

export interface HtmlProps
  extends Omit<Assign<React.HTMLAttributes<HTMLDivElement>, ReactThreeFiber.Object3DNode<Group, typeof Group>>, 'ref'> {
  prepend?: boolean
  center?: boolean
  fullscreen?: boolean
  eps?: number
  portal?: React.MutableRefObject<HTMLElement>
  distanceFactor?: number
  sprite?: boolean
  transform?: boolean
  zIndexRange?: Array<number>
  calculatePosition?: CalculatePosition
}

export const Html = React.forwardRef(
  (
    {
      children,
      eps = 0.001,
      style,
      className,
      prepend,
      center,
      fullscreen,
      portal,
      distanceFactor,
      sprite = false,
      transform = false,
      zIndexRange = [16777271, 0],
      calculatePosition = defaultCalculatePosition,
      ...props
    }: HtmlProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const { gl, scene, camera, size } = useThree()
    const [el] = React.useState(() => document.createElement('div'))
    const group = React.useRef<Group>(null)
    const oldZoom = React.useRef(0)
    const oldPosition = React.useRef([0, 0])
    const transformOuterRef = React.useRef<HTMLDivElement>(null)
    const transformInnerRef = React.useRef<HTMLDivElement>(null)
    const target = portal?.current ?? gl.domElement.parentNode

    React.useEffect(() => {
      if (group.current) {
        scene.updateMatrixWorld()
        if (transform) {
          el.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`
        } else {
          const vec = calculatePosition(group.current, camera, size)
          el.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);transform-origin:0 0;`
        }
        if (target) {
          if (prepend) target.prepend(el)
          else target.appendChild(el)
        }
        return () => {
          if (target) target.removeChild(el)
          ReactDOM.unmountComponentAtNode(el)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, transform])

    const styles: React.CSSProperties = React.useMemo(() => {
      if (transform) {
        return {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size.width,
          height: size.height,
          transformStyle: 'preserve-3d',
          pointerEvents: 'none',
        }
      } else {
        return {
          position: 'absolute',
          transform: center ? 'translate3d(-50%,-50%)' : 'none',
          ...(fullscreen && {
            top: -size.height / 2,
            left: -size.width / 2,
            width: size.width,
            height: size.height,
          }),
          ...style,
        }
      }
    }, [style, center, fullscreen, size, transform])

    const transformInnerStyles: React.CSSProperties = React.useMemo(
      () => ({ position: 'absolute', pointerEvents: 'auto', ...style }),
      [style]
    )

    React.useLayoutEffect(() => {
      if (transform) {
        ReactDOM.render(
          <div ref={transformOuterRef} style={styles}>
            <div ref={transformInnerRef} style={transformInnerStyles}>
              <div ref={ref} className={className} children={children} />
            </div>
          </div>,
          el
        )
      } else {
        ReactDOM.render(<div ref={ref} style={styles} className={className} children={children} />, el)
      }
    })

    useFrame(() => {
      if (group.current) {
        camera.updateMatrixWorld()
        const vec = transform ? oldPosition.current : calculatePosition(group.current, camera, size)

        if (
          transform ||
          Math.abs(oldZoom.current - camera.zoom) > eps ||
          Math.abs(oldPosition.current[0] - vec[0]) > eps ||
          Math.abs(oldPosition.current[1] - vec[1]) > eps
        ) {
          el.style.display = !isObjectBehindCamera(group.current, camera) ? 'block' : 'none'
          el.style.zIndex = `${objectZIndex(group.current, camera, zIndexRange)}`
          if (transform) {
            const [widthHalf, heightHalf] = [size.width / 2, size.height / 2]
            const fov = camera.projectionMatrix.elements[5] * heightHalf
            const { isOrthographicCamera, top, left, bottom, right } = camera as OrthographicCamera
            const cameraMatrix = getCameraCSSMatrix(camera.matrixWorldInverse)
            const cameraTransform = isOrthographicCamera
              ? `scale(${fov})translate(${epsilon(-(right + left) / 2)}px,${epsilon((top + bottom) / 2)}px)`
              : `translateZ(${fov}px)`
            let matrix = group.current.matrixWorld
            if (sprite) {
              matrix = camera.matrixWorldInverse.clone().transpose().copyPosition(matrix).scale(group.current.scale)
              matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0
              matrix.elements[15] = 1
            }
            el.style.width = size.width + 'px'
            el.style.height = size.height + 'px'
            el.style.perspective = isOrthographicCamera ? '' : `${fov}px`
            if (transformOuterRef.current && transformInnerRef.current) {
              transformOuterRef.current.style.transform = `${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`
              transformInnerRef.current.style.transform = getObjectCSSMatrix(matrix, 1 / ((distanceFactor || 10) / 400))
            }
          } else {
            const scale = distanceFactor === undefined ? 1 : objectScale(group.current, camera) * distanceFactor
            el.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`
          }
          oldPosition.current = vec
          oldZoom.current = camera.zoom
        }
      }
    })

    return <group {...props} ref={group} />
  }
)

export const HTML = React.forwardRef((props: HtmlProps, ref: React.Ref<HTMLDivElement>) => {
  React.useEffect(() => void console.warn('The <HTML> component was renamed to <Html>'), [])
  return <Html {...props} ref={ref} />
})
