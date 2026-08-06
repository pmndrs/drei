import * as React from 'react'
import { flushSync } from 'react-dom'
import * as ReactDOM from 'react-dom/client'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'

type CanvasWithPaint = HTMLCanvasElement & {
  requestPaint?: () => void
}

type HTMLTextureConstructor = new (element: HTMLElement) => THREE.Texture

export type HtmlTextureStatus =
  | {
      state: 'ready'
      paintCount: number
      message: string
    }
  | {
      state: 'unsupported'
      paintCount: number
      message: string
    }

export type HtmlTextureProps = Omit<ThreeElements['texture'], 'ref' | 'args'> &
  UseHtmlTextureOptions & {
    children?: React.ReactNode
  }

export type UseHtmlTextureOptions = {
  /** Width of the DOM source element in CSS pixels. */
  width?: number
  /** Height of the DOM source element in CSS pixels. */
  height?: number
  /** CSS class applied to the DOM source element. */
  className?: string
  /** Inline styles applied to the DOM source element. */
  style?: React.CSSProperties
  /** Texture color space. Defaults to the renderer output color space. */
  colorSpace?: THREE.Texture['colorSpace']
  /** Warn once when the browser does not support native HTMLTexture. */
  warnUnsupported?: boolean
  /** Observe capability and paint lifecycle state. */
  onStatusChange?: (status: HtmlTextureStatus) => void
}

function getHTMLTextureCtor(): HTMLTextureConstructor | undefined {
  return Reflect.get(THREE, 'HTMLTexture') as HTMLTextureConstructor | undefined
}

function getUnsupportedReason(canvas: CanvasWithPaint, gl: THREE.WebGLRenderer) {
  const HTMLTexture = getHTMLTextureCtor()
  const context = gl.getContext?.() as WebGLRenderingContext | undefined

  if (typeof document === 'undefined') return 'document is not available.'
  if (typeof HTMLCanvasElement === 'undefined' || !(canvas instanceof HTMLCanvasElement)) {
    return 'R3F renderer is not backed by an HTMLCanvasElement.'
  }
  if (!HTMLTexture) return 'THREE.HTMLTexture is not available.'
  if (typeof canvas.requestPaint !== 'function') return 'canvas.requestPaint() is not available.'
  if (typeof (context as unknown as { texElementImage2D?: unknown })?.texElementImage2D !== 'function') {
    return 'WebGLRenderingContext.texElementImage2D() is not available.'
  }

  return null
}

export function useHtmlTexture(
  children: React.ReactNode,
  {
    width = 512,
    height = 256,
    className,
    style,
    colorSpace,
    warnUnsupported = true,
    onStatusChange,
  }: UseHtmlTextureOptions = {}
) {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null)
  const rootRef = React.useRef<ReactDOM.Root | null>(null)
  const childrenRef = React.useRef(children)
  const warnedRef = React.useRef(false)
  const paintCountRef = React.useRef(0)
  const onStatusChangeRef = React.useRef(onStatusChange)
  const requestPaintFrameRef = React.useRef<number | null>(null)
  const paintReportFrameRef = React.useRef<number | null>(null)

  childrenRef.current = children
  onStatusChangeRef.current = onStatusChange

  React.useLayoutEffect(() => {
    const canvas = gl.domElement as CanvasWithPaint
    const unsupportedReason = getUnsupportedReason(canvas, gl)
    const HTMLTexture = getHTMLTextureCtor()

    if (unsupportedReason || !HTMLTexture) {
      const status: HtmlTextureStatus = {
        state: 'unsupported',
        paintCount: paintCountRef.current,
        message: unsupportedReason || 'THREE.HTMLTexture is not available.',
      }

      onStatusChangeRef.current?.(status)

      if (warnUnsupported && !warnedRef.current) {
        console.warn(`[HtmlTexture] ${status.message}`)
        warnedRef.current = true
      }

      return
    }

    canvas.setAttribute('layoutsubtree', '')

    const element = document.createElement('div')
    element.className = className || ''
    element.style.display = 'block'
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    element.style.position = 'absolute'
    element.style.left = '0'
    element.style.top = '0'
    element.style.pointerEvents = 'none'
    if (style) Object.assign(element.style, style)

    canvas.appendChild(element)

    const root = ReactDOM.createRoot(element)
    rootRef.current = root
    flushSync(() => {
      root.render(<>{childrenRef.current}</>)
    })

    const htmlTexture = new HTMLTexture(element)
    htmlTexture.colorSpace = colorSpace || gl.outputColorSpace
    htmlTexture.needsUpdate = true
    setTexture(htmlTexture)

    onStatusChangeRef.current?.({
      state: 'ready',
      paintCount: paintCountRef.current,
      message: 'THREE.HTMLTexture is active.',
    })

    const reportPaintStatus = () => {
      paintReportFrameRef.current = null
      onStatusChangeRef.current?.({
        state: 'ready',
        paintCount: paintCountRef.current,
        message: 'Canvas paint event observed.',
      })
    }

    const handlePaint = () => {
      paintCountRef.current += 1
      htmlTexture.needsUpdate = true

      if (paintReportFrameRef.current === null) {
        paintReportFrameRef.current = window.requestAnimationFrame(reportPaintStatus)
      }

      invalidate()
    }

    canvas.addEventListener('paint', handlePaint)
    canvas.requestPaint?.()
    requestPaintFrameRef.current = window.requestAnimationFrame(() => {
      requestPaintFrameRef.current = null
      canvas.requestPaint?.()
      invalidate()
    })

    return () => {
      canvas.removeEventListener('paint', handlePaint)

      if (paintReportFrameRef.current !== null) {
        window.cancelAnimationFrame(paintReportFrameRef.current)
        paintReportFrameRef.current = null
      }

      if (requestPaintFrameRef.current !== null) {
        window.cancelAnimationFrame(requestPaintFrameRef.current)
        requestPaintFrameRef.current = null
      }

      setTexture(null)
      htmlTexture.dispose()
      root.unmount()
      rootRef.current = null

      if (element.parentNode === canvas) {
        canvas.removeChild(element)
      }
    }
  }, [className, colorSpace, gl, height, invalidate, style, warnUnsupported, width])

  React.useLayoutEffect(() => {
    if (!rootRef.current) return

    flushSync(() => {
      rootRef.current?.render(<>{children}</>)
    })

    const canvas = gl.domElement as CanvasWithPaint
    canvas.requestPaint?.()

    if (requestPaintFrameRef.current !== null) {
      window.cancelAnimationFrame(requestPaintFrameRef.current)
    }

    requestPaintFrameRef.current = window.requestAnimationFrame(() => {
      requestPaintFrameRef.current = null
      canvas.requestPaint?.()
      invalidate()
    })
  }, [children, gl, invalidate])

  return texture
}

export const HtmlTexture = /* @__PURE__ */ React.forwardRef<THREE.Texture, HtmlTextureProps>(
  (
    { children, width, height, className, style, colorSpace, warnUnsupported, onStatusChange, ...props },
    forwardRef
  ) => {
    const texture = useHtmlTexture(children, {
      width,
      height,
      className,
      style,
      colorSpace,
      warnUnsupported,
      onStatusChange,
    })

    React.useImperativeHandle(forwardRef, () => texture!, [texture])

    if (!texture) return null

    return <primitive object={texture} {...props} />
  }
)
