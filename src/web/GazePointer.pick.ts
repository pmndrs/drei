//
// Pick helpers: the pure parts of the pick function of `GazePointer`.
//
// The component brings the gaze point from the physical screen to its canvas, casts a small bundle of rays over the
// tolerance disc, and elects one of the hits. What does not need three.js or a real window is here:
//   - the position of the page on the screen (`getGazeViewport`), and the two conversions that follow from it
//   - the conversion from the page to the normalised device coordinates of a canvas (`gazeClientToNdc`)
//   - the layout of the rays over the disc (`gazeRayBundle`)
//   - the choice of the hit closest to the centre of the disc (`closestGazeHit`).
//
// Frames (pixels are CSS pixels everywhere):
//   - screen: the physical screen, origin at its top left corner, +y down. The frame of the gaze point.
//   - client: the page as laid out in its window (the layout viewport), origin at its top left corner, +y down. The
//     frame of `getBoundingClientRect()` and of `clientX` / `clientY`.
//   - NDC: normalised device coordinates of a canvas, from -1 to 1, origin at its centre, +y up. The frame three.js
//     casts rays from.
//

//
// Types
//

/** A point in pixels, in the screen frame or in the client frame. */
export type GazePoint = { x: number; y: number }

/**
 * What is read from a window to locate its page on the screen. A DOM `Window` is assignable to it.
 */
export type GazeWindow = {
  /** Position of the top left corner of the browser window on the screen. */
  screenX: number
  screenY: number
  /** Size of the browser window, chrome included. */
  outerWidth: number
  outerHeight: number
  /** Size of the page. */
  innerWidth: number
  innerHeight: number
  /** The window that holds this one when it is a frame. A top window is its own parent. */
  parent?: GazeWindow
  /** The frame element that holds this window, `null` for a top window and for a frame of another origin. */
  frameElement?: { getBoundingClientRect(): { left: number; top: number } } | null
}

/** The rectangle of a canvas in the client frame: what `getBoundingClientRect()` returns. */
export type GazeRect = { left: number; top: number; width: number; height: number }

/** What one ray of the bundle hit. */
export type GazeRayHit<Target, Hit> = {
  /** Distance between the ray and the centre of the disc. Any unit, the same for every ray. */
  offset: number
  /** The target the ray stopped at. Targets are compared by identity. */
  target: Target
  /** Distance between the camera and the hit. */
  distance: number
  /** Anything to hand back with the target. */
  hit: Hit
}

//
// From the screen to the canvas
//

/**
 * Where the page of a window sits on the physical screen: the position, in screen pixels, of the top left corner of
 * its layout viewport.
 *
 * A browser tells where its window is and how large the window and the page are, not where the page is inside the
 * window. It is estimated: a window wider than its page is taken as framed by borders of equal width on the left, on
 * the right and at the bottom; what is left of the height difference, the tabs and the toolbars, is above the page.
 * It is exact in fullscreen. It is wrong when something is docked beside or below the page (developer tools, a side
 * panel), and under a page zoom, which scales the page and not the window.
 *
 * A page nested in frames of its own origin is followed up to the top window. A frame of another origin hides its
 * position: it is taken as the top window.
 *
 * @param view The window of the page. Default: the global `window`.
 */
export function getGazeViewport(view: GazeWindow = globalThis as unknown as GazeWindow): GazePoint {
  // the position of the page inside the top window: the sum of the positions of the frames it is nested in
  let x = 0
  let y = 0
  let top = view
  while (top.frameElement && top.parent && top.parent !== top) {
    const frame = top.frameElement.getBoundingClientRect()
    x += frame.left
    y += frame.top
    top = top.parent
  }

  const border = Math.max(0, (top.outerWidth - top.innerWidth) / 2)
  const chrome = Math.max(0, top.outerHeight - top.innerHeight - border)

  return { x: top.screenX + border + x, y: top.screenY + chrome + y }
}

/**
 * Converts a point of the screen to the client frame of a page.
 *
 * @param point A point in screen pixels.
 * @param viewport Where the page sits on the screen: `getGazeViewport()`.
 */
export function gazeScreenToClient(point: GazePoint, viewport: GazePoint): GazePoint {
  return { x: point.x - viewport.x, y: point.y - viewport.y }
}

/**
 * Converts a point of the client frame of a page to the screen: the reverse of `gazeScreenToClient`. This is how the
 * position of an element of the page (a calibration point) is expressed as a point of the screen.
 *
 * @param point A point in the client frame, as in `getBoundingClientRect()`.
 * @param viewport Where the page sits on the screen: `getGazeViewport()`.
 */
export function gazeClientToScreen(point: GazePoint, viewport: GazePoint): GazePoint {
  return { x: point.x + viewport.x, y: point.y + viewport.y }
}

/**
 * Converts a point of the client frame to the normalised device coordinates of a canvas.
 *
 * @param point A point in the client frame.
 * @param rect The rectangle of the canvas: `canvas.getBoundingClientRect()`.
 * @returns The point from -1 to 1 on both axes, +y up, or `null` when it is outside the canvas.
 */
export function gazeClientToNdc(point: GazePoint, rect: GazeRect): GazePoint | null {
  if (!(rect.width > 0) || !(rect.height > 0)) return null

  const x = (point.x - rect.left) / rect.width
  const y = (point.y - rect.top) / rect.height
  if (x < 0 || x > 1 || y < 0 || y > 1) return null

  return { x: x * 2 - 1, y: 1 - y * 2 }
}

//
// The ray bundle
//

/** Above this number of rays around the centre, they are laid on two rings instead of one. */
const MAX_SINGLE_RING = 8

/**
 * Lays the rays of the bundle over a disc of radius 1: the centre first, then the rings.
 *
 * - Up to 9 rays: the centre and one ring on the edge of the disc.
 * - Beyond: the centre and two rings, a third of the remaining rays at half the radius and the others on the edge,
 *   the two rings turned against each other.
 *
 * @param count Number of rays. Below 1 it is 1, a fraction is dropped. `GazePointer` uses 7 by default.
 * @returns The position of each ray, to scale by the radius of the disc.
 */
export function gazeRayBundle(count: number): GazePoint[] {
  const bundle: GazePoint[] = [{ x: 0, y: 0 }]

  const around = Number.isFinite(count) ? Math.floor(count) - 1 : 0
  if (around <= 0) return bundle

  const inner = around > MAX_SINGLE_RING ? Math.round(around / 3) : 0
  const outer = around - inner

  for (let i = 0; i < inner; i++) {
    const angle = (i / inner) * 2 * Math.PI
    bundle.push({ x: 0.5 * Math.cos(angle), y: 0.5 * Math.sin(angle) })
  }
  for (let i = 0; i < outer; i++) {
    // half a step ahead, so the outer rays fall between the inner ones
    const angle = ((i + (inner > 0 ? 0.5 : 0)) / outer) * 2 * Math.PI
    bundle.push({ x: Math.cos(angle), y: Math.sin(angle) })
  }

  return bundle
}

//
// The election of a frame
//

/**
 * Chooses, among what the rays of the bundle hit, the candidate of the frame: the target hit closest to the centre
 * of the disc.
 *
 * Each ray reports the first object it stops at, so a hidden object is never among the hits. Between hits at the same
 * distance from the centre (two targets on one ring), the target hit by more rays of the bundle wins, then the one
 * closer to the camera.
 *
 * @param hits What each ray hit; rays that hit nothing are left out.
 * @returns The target and the `hit` of its ray closest to the centre, or `null` when no ray hit anything.
 */
export function closestGazeHit<Target, Hit>(
  hits: ReadonlyArray<GazeRayHit<Target, Hit>>
): { target: Target; hit: Hit } | null {
  const counts = new Map<Target, number>()
  for (const hit of hits) counts.set(hit.target, (counts.get(hit.target) ?? 0) + 1)

  let best: GazeRayHit<Target, Hit> | null = null
  for (const hit of hits) {
    if (best === null || isCloser(hit, best, counts)) best = hit
  }

  return best ? { target: best.target, hit: best.hit } : null
}

/** Whether hit `a` is to be preferred to hit `b`. Equal hits keep the first one. */
function isCloser<Target, Hit>(
  a: GazeRayHit<Target, Hit>,
  b: GazeRayHit<Target, Hit>,
  counts: Map<Target, number>
): boolean {
  if (a.offset !== b.offset) return a.offset < b.offset

  const countA = counts.get(a.target) ?? 0
  const countB = counts.get(b.target) ?? 0
  if (countA !== countB) return countA > countB

  return a.distance < b.distance
}
