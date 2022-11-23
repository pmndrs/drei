import * as React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

export type SizeProps = {
  box: THREE.Box3
  size: THREE.Vector3
  center: THREE.Vector3
  distance: number
}

export type BoundsApi = {
  getSize: () => SizeProps
  refresh(object?: THREE.Object3D | THREE.Box3): any
  clip(): any
  fit(): any
  to: ({ position, target }: { position: [number, number, number]; target?: [number, number, number] }) => any
}

export type BoundsProps = JSX.IntrinsicElements['group'] & {
  damping?: number
  fit?: boolean
  clip?: boolean
  observe?: boolean
  margin?: number
  eps?: number
  onFit?: (data: SizeProps) => void
}

type ControlsProto = {
  update(): void
  target: THREE.Vector3
  maxDistance: number
  addEventListener: (event: string, callback: (event: any) => void) => void
  removeEventListener: (event: string, callback: (event: any) => void) => void
}

const isOrthographic = (def: THREE.Camera): def is THREE.OrthographicCamera =>
  def && (def as THREE.OrthographicCamera).isOrthographicCamera
const isBox3 = (def: any): def is THREE.Box3 => def && (def as THREE.Box3).isBox3

const context = React.createContext<BoundsApi>(null!)
export function Bounds({ children, damping = 6, fit, clip, observe, margin = 1.2, eps = 0.01, onFit }: BoundsProps) {
  const ref = React.useRef<THREE.Group>(null!)
  const { camera, invalidate, size, controls: controlsImpl } = useThree()
  const controls = controlsImpl as unknown as ControlsProto

  const onFitRef = React.useRef<((data: SizeProps) => void) | undefined>(onFit)
  onFitRef.current = onFit

  function equals(a, b) {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps
  }

  function damp(v, t, lambda, delta) {
    v.x = THREE.MathUtils.damp(v.x, t.x, lambda, delta)
    v.y = THREE.MathUtils.damp(v.y, t.y, lambda, delta)
    v.z = THREE.MathUtils.damp(v.z, t.z, lambda, delta)
  }

  const [current] = React.useState(() => ({
    animating: false,
    focus: new THREE.Vector3(),
    camera: new THREE.Vector3(),
    zoom: 1,
  }))
  const [goal] = React.useState(() => ({ focus: new THREE.Vector3(), camera: new THREE.Vector3(), zoom: 1 }))

  const [box] = React.useState(() => new THREE.Box3())
  const api: BoundsApi = React.useMemo(() => {
    function getSize() {
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxSize = Math.max(size.x, size.y, size.z)
      const fitHeightDistance = isOrthographic(camera)
        ? maxSize * 4
        : maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360))
      const fitWidthDistance = isOrthographic(camera) ? maxSize * 4 : fitHeightDistance / camera.aspect
      const distance = margin * Math.max(fitHeightDistance, fitWidthDistance)
      return { box, size, center, distance }
    }

    return {
      getSize,
      refresh(object?: THREE.Object3D | THREE.Box3) {
        if (isBox3(object)) box.copy(object)
        else {
          const target = object || ref.current
          target.updateWorldMatrix(true, true)
          box.setFromObject(target)
        }
        if (box.isEmpty()) {
          const max = camera.position.length() || 10
          box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(max, max, max))
        }

        if (controls?.constructor.name === 'OrthographicTrackballControls') {
          // Put camera on a sphere along which it should move
          const { distance } = getSize()
          const direction = camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance)
          const newPos = controls.target.clone().add(direction)
          camera.position.copy(newPos)
        }

        return this
      },
      clip() {
        const { distance } = getSize()
        if (controls) controls.maxDistance = distance * 10
        camera.near = distance / 100
        camera.far = distance * 100
        camera.updateProjectionMatrix()
        if (controls) controls.update()
        invalidate()
        return this
      },
      to({ position, target }: { position: [number, number, number]; target?: [number, number, number] }) {
        current.camera.copy(camera.position)
        const { center } = getSize()
        goal.camera.set(...position)

        if (target) {
          goal.focus.set(...target)
        } else {
          goal.focus.copy(center)
        }

        if (damping) {
          current.animating = true
        } else {
          camera.position.set(...position)
        }

        return this
      },
      fit() {
        current.camera.copy(camera.position)
        if (controls) current.focus.copy(controls.target)

        const { center, distance } = getSize()
        const direction = center.clone().sub(camera.position).normalize().multiplyScalar(distance)

        goal.camera.copy(center).sub(direction)
        goal.focus.copy(center)

        if (isOrthographic(camera)) {
          current.zoom = camera.zoom

          let maxHeight = 0,
            maxWidth = 0
          const vertices = [
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
          ]
          // Transform the center and each corner to camera space
          center.applyMatrix4(camera.matrixWorldInverse)
          for (const v of vertices) {
            v.applyMatrix4(camera.matrixWorldInverse)
            maxHeight = Math.max(maxHeight, Math.abs(v.y - center.y))
            maxWidth = Math.max(maxWidth, Math.abs(v.x - center.x))
          }
          maxHeight *= 2
          maxWidth *= 2
          const zoomForHeight = (camera.top - camera.bottom) / maxHeight
          const zoomForWidth = (camera.right - camera.left) / maxWidth
          goal.zoom = Math.min(zoomForHeight, zoomForWidth) / margin
          if (!damping) {
            camera.zoom = goal.zoom
            camera.updateProjectionMatrix()
          }
        }

        if (damping) {
          current.animating = true
        } else {
          camera.position.copy(goal.camera)
          camera.lookAt(goal.focus)
          if (controls) {
            controls.target.copy(goal.focus)
            controls.update()
          }
        }
        if (onFitRef.current) onFitRef.current(this.getSize())
        invalidate()
        return this
      },
    }
  }, [box, camera, controls, margin, damping, invalidate])

  React.useLayoutEffect(() => {
    if (controls) {
      // Try to prevent drag hijacking
      const callback = () => (current.animating = false)
      controls.addEventListener('start', callback)
      return () => controls.removeEventListener('start', callback)
    }
  }, [controls])

  // Scale pointer on window resize
  const count = React.useRef(0)
  React.useLayoutEffect(() => {
    if (observe || count.current++ === 0) {
      api.refresh()
      if (fit) api.fit()
      if (clip) api.clip()
    }
  }, [size, clip, fit, observe, camera, controls])

  useFrame((state, delta) => {
    if (current.animating) {
      damp(current.focus, goal.focus, damping, delta)
      damp(current.camera, goal.camera, damping, delta)
      current.zoom = THREE.MathUtils.damp(current.zoom, goal.zoom, damping, delta)
      camera.position.copy(current.camera)

      if (isOrthographic(camera)) {
        camera.zoom = current.zoom
        camera.updateProjectionMatrix()
      }

      if (!controls) {
        camera.lookAt(current.focus)
      } else {
        controls.target.copy(current.focus)
        controls.update()
      }

      invalidate()
      if (isOrthographic(camera) && !(Math.abs(current.zoom - goal.zoom) < eps)) return
      if (!isOrthographic(camera) && !equals(current.camera, goal.camera)) return
      if (controls && !equals(current.focus, goal.focus)) return
      current.animating = false
    }
  })

  return (
    <group ref={ref}>
      <context.Provider value={api}>{children}</context.Provider>
    </group>
  )
}

export function useBounds() {
  return React.useContext(context)
}
