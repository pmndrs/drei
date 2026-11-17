//
// Debug overlay of `GazePointer`: the gaze point, the tolerance disc and the elected target, drawn with DOM elements
// laid over the canvas.
//
// It never takes pointer events, and it is removed as a whole by `dispose()`.
//

import type { GazePoint, GazeRect } from './GazePointer.pick'

/** What the overlay draws for one frame. Everything is in the client frame, as in `getBoundingClientRect()`. */
export type GazeDebugFrame = {
  /** The gaze point, `null` when there is none. */
  point: GazePoint | null
  /** Radius of the tolerance disc around the point, in pixels. */
  radius: number
  /** The rectangle around the elected target, `null` when there is none. */
  target: GazeRect | null
}

/** A debug overlay, as returned by `createGazeDebugOverlay`. */
export type GazeDebugOverlay = {
  /** Draws a frame. */
  update(frame: GazeDebugFrame): void
  /** Removes the overlay from the page. */
  dispose(): void
}

const COLOR = '#ff2d78'
const DOT_SIZE = 8

/**
 * Adds a debug overlay to an element that covers the canvas (its parent).
 *
 * @param parent The element the overlay is appended to.
 */
export function createGazeDebugOverlay(parent: HTMLElement): GazeDebugOverlay {
  const document = parent.ownerDocument

  const root = document.createElement('div')
  root.setAttribute('data-gaze-pointer-debug', '')
  root.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1'

  const create = (name: string, style: string) => {
    const element = document.createElement('div')
    element.setAttribute('data-gaze-pointer-debug', name)
    element.style.cssText = `position:absolute;left:0;top:0;box-sizing:border-box;display:none;${style}`
    root.appendChild(element)
    return element
  }

  const target = create('target', `border:2px dashed ${COLOR}`)
  const disc = create('disc', `border:1px solid ${COLOR};border-radius:50%;background:${COLOR}22`)
  const dot = create('point', `width:${DOT_SIZE}px;height:${DOT_SIZE}px;border-radius:50%;background:${COLOR}`)

  parent.appendChild(root)

  /** Places an element on a rectangle of the client frame, or hides it. */
  function place(element: HTMLElement, rect: GazeRect | null, origin: GazePoint) {
    if (!rect) {
      element.style.display = 'none'
      return
    }
    element.style.display = 'block'
    element.style.transform = `translate(${rect.left - origin.x}px, ${rect.top - origin.y}px)`
    element.style.width = `${rect.width}px`
    element.style.height = `${rect.height}px`
  }

  function update({ point, radius, target: targetRect }: GazeDebugFrame) {
    // the overlay positions its elements relative to itself
    const bounds = root.getBoundingClientRect()
    const origin = { x: bounds.left, y: bounds.top }

    place(target, targetRect, origin)
    place(
      disc,
      point && { left: point.x - radius, top: point.y - radius, width: radius * 2, height: radius * 2 },
      origin
    )
    place(
      dot,
      point && { left: point.x - DOT_SIZE / 2, top: point.y - DOT_SIZE / 2, width: DOT_SIZE, height: DOT_SIZE },
      origin
    )
  }

  function dispose() {
    root.remove()
  }

  return { update, dispose }
}
