import * as THREE from 'three'
import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing, misc } from 'maath'

type MotionPathProps = JSX.IntrinsicElements['group'] & {
  curves?: THREE.Curve[]
  debug?: boolean
  object?: React.MutableRefObject<THREE.Object3D>
  focus?: [x: number, y: number, z: number] | React.MutableRefObject<THREE.Object3D> 
  offset?: number
  smooth?: boolean
  eps?: number
  damping?: number
  maxSpeed?: number
}

const context = React.createContext()

export function useMotion() {
  return React.useContext(context)
}

function Debug({ points = 50 }: { points?: number, path: React.MutableRefObject<THREE.CurvePath> }) {
  const { path } = useMotion()  
  const [dots, setDots] = React.useState<THREE.Vector3[]>([])
  const [material] = React.useState(() => new THREE.MeshBasicMaterial({ color: "black" }))
  const [geometry] = React.useState(() => new THREE.SphereGeometry(0.025, 16, 16))
  const last = React.useRef()
  React.useEffect(() => {
    if (path.curves !== last.current) {      
      setDots(path.getPoints(points))    
      last.current = path.curves
    }
  })
  return (
    <>
      {dots.map((item: { x: any; y: any; z: any }, index: any) => (
        <mesh key={index} material={material} geometry={geometry} position={[item.x, item.y, item.z]} />
      ))}
    </>
  )
}

export const MotionPathControls = React.forwardRef<THREE.Goup>(
  (
    {
      children,
      curves = [],
      object,
      debug = false,
      smooth = false,
      focus,
      offset = undefined,      
      eps = 0.00001,
      damping = 0.1,
      lookupDamping = 0.1,
      maxSpeed = Infinity,
      ...props
    }: MotionPathProps,
    fref
  ) => {
    const { camera } = useThree()
    const ref = React.useRef<any>()
    const [path] = React.useState(() => new THREE.CurvePath<THREE.Vector3>())

    const pos = React.useRef(offset ?? 0)
    const state = React.useMemo(() => ({
      focus,
      object: object?.current instanceof THREE.Object3D ? object : { current: camera },
      path,
      current: pos.current,
      offset: pos.current,
      point: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      next: new THREE.Vector3(),
    }), [focus, object])

    React.useLayoutEffect(() => {      
      path.curves = []
      const _curves = curves.length > 0 ? curves : ref.current?.__r3f.objects
      for (var i = 0; i < _curves.length; i++) path.add(_curves[i])

      //Smoothen curve
      if (smooth) {
        const points = path.getPoints(typeof smooth === "number" ? smooth : 1)        
        const catmull = new THREE.CatmullRomCurve3(points)
        path.curves = [catmull]
      }
      path.updateArcLengths()  
    })

    React.useImperativeHandle(fref, () => ref.current, [])

    React.useLayoutEffect(() => {
      // When offset changes, normalise pos to avoid overshoot spinning
      pos.current = misc.repeat(pos.current, 1)
    }, [offset])

    let last = 0
    const [vec] = React.useState(() => new THREE.Vector3())

    useFrame((_state, delta) => {
      last = state.offset          
      easing.damp(pos, "current", offset !== undefined ? offset : state.current, damping, delta, maxSpeed, undefined, eps)
      state.offset = misc.repeat(pos.current, 1)
      
      if (path.getCurveLengths().length > 0) {
        path.getPointAt(state.offset, state.point)
        path.getTangentAt(state.offset, state.tangent).normalize()
        path.getPointAt(misc.repeat(pos.current - (last - state.offset), 1), state.next)
        const target = object?.current instanceof THREE.Object3D ? object.current : camera
        target.position.copy(state.point)      
        easing.dampLookAt(target, focus?.current instanceof THREE.Object3D ? focus.current.getWorldPosition(vec) : focus, lookupDamping, delta, maxSpeed, undefined, eps)        
      }
    })

    return (
      <group ref={ref} {...props}>
        <context.Provider value={state}>
          {children}
          {debug && <Debug />}
        </context.Provider>
      </group>
    )
  }
)
