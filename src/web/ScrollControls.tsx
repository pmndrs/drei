import * as THREE from 'three'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { context as fiberContext, useFrame, useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

export type ScrollControlsProps = {
  eps?: number
  horizontal?: boolean
  pages?: number
  distance?: number
  damping?: number
  children: React.ReactNode
}

export type ScrollControlsState = {
  el: HTMLDivElement
  eps: number
  fill: HTMLDivElement
  fixed: HTMLDivElement
  horizontal: boolean | undefined
  damping: number
  offset: number
  delta: number
  pages: number
  range(start: number, range: number): number
  visible(start: number, range: number): boolean
}

const context = React.createContext<ScrollControlsState>(null!)

export function useScroll() {
  return React.useContext(context)
}

export function ScrollControls({
  eps = 0.00001,
  horizontal,
  pages = 1,
  distance = 1,
  damping = 4,
  children,
}: ScrollControlsProps) {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const events = useThree((state) => state.events)
  const raycaster = useThree((state) => state.raycaster)
  const [el] = React.useState(() => document.createElement('div'))
  const [fill] = React.useState(() => document.createElement('div'))
  const [fixed] = React.useState(() => document.createElement('div'))
  const target = gl.domElement.parentNode!
  const scroll = React.useRef(0)

  const state = React.useMemo(() => {
    const state = {
      el,
      eps,
      fill,
      fixed,
      horizontal,
      damping,
      offset: 0,
      delta: 0,
      pages,
      // 0 - 1 for a range between start -> start + range
      range(start: number, range: number) {
        const end = start + range
        return this.offset < start ? 0 : this.offset > end ? 1 : (this.offset - start) / (end - start)
      },
      // true/false for a range between start -> start + range
      visible(start: number, range: number) {
        const end = start + range
        return this.offset >= start && this.offset <= end
      },
    }
    return state
  }, [eps, damping, horizontal, pages])

  React.useEffect(() => {
    el.style.position = 'absolute'
    el.style.width = '100%'
    el.style.height = '100%'
    el.style[horizontal ? 'overflowX' : 'overflowY'] = 'auto'
    el.style.top = '0px'
    el.style.left = '0px'

    fixed.style.position = 'sticky'
    fixed.style.top = '0px'
    fixed.style.left = '0px'
    el.appendChild(fixed)

    fill.style.height = horizontal ? '100%' : `${pages * distance * 100}%`
    fill.style.width = horizontal ? `${pages * distance * 100}%` : '100%'
    fill.style.pointerEvents = 'none'
    el.appendChild(fill)

    const onScroll = (e) => {
      invalidate()
      scroll.current = horizontal
        ? e.target.scrollLeft / (e.target.scrollWidth - e.target.clientWidth)
        : e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight)
    }
    el.addEventListener('scroll', onScroll, { passive: true })

    target.appendChild(el)

    requestAnimationFrame(() => events.connect?.(el))
    raycaster.computeOffsets = ({ clientX, clientY }) => ({ offsetX: clientX, offsetY: clientY })
    return () => {
      target.removeChild(el)
      el.removeEventListener('scroll', onScroll)
    }
  }, [invalidate, distance, damping, pages, horizontal])

  let last = 0
  useFrame((_, delta) => {
    state.offset = THREE.MathUtils.damp((last = state.offset), scroll.current, damping, delta)
    state.delta = THREE.MathUtils.damp(state.delta, Math.abs(last - state.offset), damping, delta)
    if (state.delta > eps) invalidate()
  })
  return <context.Provider value={state}>{children}</context.Provider>
}

export const Scroll = React.forwardRef(({ html, ...props }: { html?: boolean }, ref) => {
  const El = html ? ScrollHtml : ScrollCanvas
  return <El ref={ref} {...props} />
})

const ScrollCanvas = React.forwardRef(({ children }, ref) => {
  const group = React.useRef<THREE.Group>(null!)
  const state = useScroll()
  const { width, height } = useThree((state) => state.viewport)
  useFrame(() => {
    group.current.position.x = state.horizontal ? -width * (state.pages - 1) * state.offset : 0
    group.current.position.y = state.horizontal ? 0 : height * (state.pages - 1) * state.offset
  })
  return <group ref={mergeRefs([ref, group])}>{children}</group>
})

const ScrollHtml = React.forwardRef(
  ({ children, style, ...props }: { children?: React.ReactNode; style?: React.StyleHTMLAttributes<any> }, ref) => {
    const state = useScroll()
    const group = React.useRef<HTMLDivElement>(null!)
    const { width, height } = useThree((state) => state.size)
    const fiberState = React.useContext(fiberContext)
    useFrame(() => {
      if (state.delta > state.eps) {
        group.current.style.transform = `translate3d(${
          state.horizontal ? -width * (state.pages - 1) * state.offset : 0
        }px,${state.horizontal ? 0 : height * (state.pages - 1) * -state.offset}px,0)`
      }
    })
    ReactDOM.render(
      <div
        ref={mergeRefs([ref, group])}
        style={{ ...style, position: 'absolute', top: 0, left: 0, willChange: 'transform' }}
        {...props}
      >
        <context.Provider value={state}>
          <fiberContext.Provider value={fiberState}>{children}</fiberContext.Provider>
        </context.Provider>
      </div>,
      state.fixed
    )
    return null
  }
)
