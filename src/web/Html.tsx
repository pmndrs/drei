import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { Vector3, Group, Object3D, Matrix4, Camera, PerspectiveCamera, OrthographicCamera, Raycaster } from 'three'
import { Assign } from 'utility-types'
import { ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'

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

function isObjectVisible(el: Object3D, camera: Camera, raycaster: Raycaster, occlude: Object3D[]) {
  const elPos = v1.setFromMatrixPosition(el.matrixWorld)
  const screenPos = elPos.clone()
  screenPos.project(camera)
  raycaster.setFromCamera(screenPos, camera)
  const intersects = raycaster.intersectObjects(occlude, true)
  if (intersects.length) {
    const intersectionDistance = intersects[0].distance
    const pointDistance = elPos.distanceTo(raycaster.ray.origin)
    return pointDistance < intersectionDistance
  }
  return true
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

type PointerEventsProperties =
  | 'auto'
  | 'none'
  | 'visiblePainted'
  | 'visibleFill'
  | 'visibleStroke'
  | 'visible'
  | 'painted'
  | 'fill'
  | 'stroke'
  | 'all'
  | 'inherit'

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
  occlude?: React.RefObject<Object3D>[] | boolean
  onOcclude?: (visible: boolean) => null
  calculatePosition?: CalculatePosition
  as?: string
  wrapperClass?: string
  pointerEvents?: PointerEventsProperties
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
      occlude,
      onOcclude,
      zIndexRange = [16777271, 0],
      calculatePosition = defaultCalculatePosition,
      as = 'div',
      wrapperClass,
      pointerEvents = 'auto',
      ...props
    }: HtmlProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const { gl, camera, scene, size, raycaster, events } = useThree()

    const [el] = React.useState(() => document.createElement(as))
    const root = React.useRef<ReactDOM.Root>()
    const group = React.useRef<Group>(null!)
    const oldZoom = React.useRef(0)
    const oldPosition = React.useRef([0, 0])
    const transformOuterRef = React.useRef<HTMLDivElement>(null!)
    const transformInnerRef = React.useRef<HTMLDivElement>(null!)
    // Append to the connected element, which makes HTML work with views
    const target = (portal?.current || events.connected || gl.domElement.parentNode) as HTMLElement

    React.useLayoutEffect(() => {
      if (group.current) {
        const currentRoot = (root.current = ReactDOM.createRoot(el))
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
          currentRoot.unmount()
        }
      }
    }, [target, transform])

    React.useLayoutEffect(() => {
      if (wrapperClass) el.className = wrapperClass
    }, [wrapperClass])

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
          transform: center ? 'translate3d(-50%,-50%,0)' : 'none',
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
      () => ({ position: 'absolute', pointerEvents }),
      [pointerEvents]
    )

    React.useLayoutEffect(() => {
      if (transform) {
        root.current?.render(
          <div ref={transformOuterRef} style={styles}>
            <div ref={transformInnerRef} style={transformInnerStyles}>
              <div ref={ref} className={className} style={style} children={children} />
            </div>
          </div>
        )
      } else {
        root.current?.render(<div ref={ref} style={styles} className={className} children={children} />)
      }
    })

    const visible = React.useRef(true)

    useFrame(() => {
      if (group.current) {
        camera.updateMatrixWorld()
        group.current.updateWorldMatrix(true, false)
        const vec = transform ? oldPosition.current : calculatePosition(group.current, camera, size)

        if (
          transform ||
          Math.abs(oldZoom.current - camera.zoom) > eps ||
          Math.abs(oldPosition.current[0] - vec[0]) > eps ||
          Math.abs(oldPosition.current[1] - vec[1]) > eps
        ) {
          const isBehindCamera = isObjectBehindCamera(group.current, camera)
          let raytraceTarget: null | undefined | boolean | Object3D[] = false
          if (typeof occlude === 'boolean') {
            if (occlude === true) {
              raytraceTarget = [scene]
            }
          } else if (Array.isArray(occlude)) {
            raytraceTarget = occlude.map((item) => item.current) as Object3D[]
          }

          const previouslyVisible = visible.current
          if (raytraceTarget) {
            const isvisible = isObjectVisible(group.current, camera, raycaster, raytraceTarget)
            visible.current = isvisible && !isBehindCamera
          } else {
            visible.current = !isBehindCamera
          }

          if (previouslyVisible !== visible.current) {
            if (onOcclude) onOcclude(!visible.current)
            else el.style.display = visible.current ? 'block' : 'none'
          }

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
