/**
 * Uncaptured WebGPU error capture for the story suite (#2817).
 *
 * The suite renders every story in headless Chromium with a real WebGPU device.
 * When a shader fails to compile, Dawn reports it on `GPUDevice.onuncapturederror`,
 * three's `WebGPUBackend` forwards it to `renderer.onError(info)`, and the default
 * implementation just `console.error`s it. Nothing fails, so a broken shader passes.
 *
 * `Setup` calls `attachGpuErrorCapture` for every Canvas it mounts. We wrap the
 * renderer's `onError` so the errors are recorded here (and still logged), and
 * `.storybook/vitest.setup.ts` drains the record after every story.
 *
 * Why `renderer.onError` rather than a `console.error` spy: it is the hook three
 * itself designates for this, it receives the structured `{ api, type, message }`
 * rather than a formatted string, and it fires for exactly the device that story
 * created — a console spy would also catch unrelated `console.error` calls and
 * depends on three's message formatting.
 *
 * Why not `device.addEventListener('uncapturederror')`: three assigns
 * `device.onuncapturederror` during `backend.init()`, which r3f awaits before the
 * store exposes `renderer`. Adding our own listener would work, but wrapping
 * `onError` gets the same event through the public renderer surface without
 * reaching into `renderer.backend.device`.
 */

//* Types ==============================

export type GpuError = {
  /** `GPUValidationError`, `GPUOutOfMemoryError`, `GPUInternalError`, ... */
  type: string
  message: string
}

type OnErrorInfo = { api?: string; type?: string; message?: string }

/** The subset of three's `Renderer` and r3f's root state we touch. Kept loose on purpose:
 *  `@types/three` declares `onError` as `(message: string) => void` but the runtime passes an object,
 *  and `GPUDevice` is out of reach because tsconfig maps `@webgpu/*` onto `src/webgpu/`. */
type CapturedRenderer = {
  onError?: (info: OnErrorInfo) => void
  init?: () => Promise<unknown>
  backend?: { isWebGPUBackend?: boolean; device?: { queue: { onSubmittedWorkDone(): Promise<void> } } }
}

type CapturedRoot = {
  renderer: CapturedRenderer
  /** r3f root-state getter, used to step the loop when a story froze it. */
  getState: () => { frameloop?: string; advance?: (timestamp: number) => void }
}

//* Allowlist ==============================

/**
 * Errors that come from the environment, not from drei. Keep this tiny and specific.
 *
 * three r0.185.1's mipmap generator (`renderers/webgpu/utils/WebGPUTexturePassUtils.js`,
 * shader label `"mipmap"`) declares `@interpolate(flat, either)` in its WGSL. The
 * Chromium that Playwright 1.45 pins (127.0.6533, Dawn of mid-2024) predates the
 * `either` sampling mode, so the shader fails to parse. Everything else here
 * cascades from that one parse error, in the order Dawn reports it: the shader
 * module, the render pipeline built from it, the bind-group layout taken from
 * that pipeline, the render bundle that recorded the mipmap draw, and the
 * command buffer that executed it. None of it is drei's code, and it goes away
 * when Playwright's Chromium is bumped — delete this list then.
 *
 * Three of the cascade objects are unlabeled in three (`BindGroupLayout`,
 * `RenderBundle`, and one `CommandBuffer`), so their patterns are not
 * mipmap-specific. That cannot hide a drei failure: Dawn reports the root cause
 * as its own error first, and every root a drei component could produce is
 * labelled — `Invalid RenderPipeline "<label>"`, `Invalid ShaderModule
 * "fragment_<name>"`, or a descriptive message for a bad layout descriptor —
 * none of which is allowlisted unless it is three's `"mipmap…"`.
 *
 * `WGSLNodeBuilder` emits the same `either` attribute for any integer varying,
 * so a drei material with one would trip the same parse error on this
 * Chromium; that case is *not* allowlisted beyond the parse line itself and
 * would still fail on its `Invalid ShaderModule "fragment_…"` line.
 */
export const KNOWN_ENVIRONMENTAL_GPU_ERRORS: ReadonlyArray<{ reason: string; pattern: RegExp }> = [
  {
    reason: "three r185 mipmap WGSL uses @interpolate(flat, either); Chromium 127's Dawn can't parse it",
    pattern: /unresolved interpolation sampling 'either'/,
  },
  {
    reason: 'cascade: the mipmap shader module itself',
    pattern: /\[Invalid ShaderModule "mipmap"\]/,
  },
  {
    reason: 'cascade: pipeline built from the mipmap shader',
    pattern: /\[Invalid RenderPipeline "mipmap-/,
  },
  {
    reason: 'cascade: bind-group layout taken from the invalid mipmap pipeline (three leaves it unlabeled)',
    pattern: /\[Invalid BindGroupLayout \(unlabeled\)\]/,
  },
  {
    reason: 'cascade: render bundle that recorded the mipmap draw (three leaves it unlabeled)',
    pattern: /\[Invalid RenderBundle\]/,
  },
  {
    // The unlabeled form is only ever observed in stories that also hit the
    // mipmap parse error; three labels every other encoder it submits.
    reason: 'cascade: command buffer that executed the mipmap bundle',
    pattern: /\[Invalid CommandBuffer(?: from CommandEncoder "mipmapEncoder")?\]/,
  },
  {
    // `Renderer.copyFramebufferToTexture` records the mipmap pass on the
    // frame's own encoder (`WebGPUBackend.copyFramebufferToTexture`, "mipmaps
    // must be generated with the same encoder"), so the invalid bundle takes
    // the whole frame's command buffer down with it. `viewportMipTexture` —
    // i.e. any `transmission` — and the portal/trail render targets hit this.
    // Chrome 145 and 153 render those same stories with zero errors.
    reason: 'cascade: frame command buffer that carried a copyFramebufferToTexture mipmap pass',
    pattern: /\[Invalid CommandBuffer from CommandEncoder "renderContext_\d+"\]/,
  },
]

export function isKnownEnvironmentalGpuError(error: GpuError): boolean {
  return KNOWN_ENVIRONMENTAL_GPU_ERRORS.some(({ pattern }) => pattern.test(error.message))
}

//* Capture ==============================

const CAPTURED = Symbol.for('drei.gpuErrorCapture')

const errors: GpuError[] = []
/** Canvases `Setup` has mounted whose renderer has not reported in yet. */
const pending = new Set<symbol>()
/** Canvases whose renderer is initialised and wrapped. */
const roots = new Set<CapturedRoot>()
let onChange: (() => void) | null = null

/**
 * `Setup` calls this synchronously when it mounts, before r3f has had a chance to
 * create the renderer. A story resolves in a few milliseconds, well before
 * `requestDevice()` returns, so without this `settleGpu` would find nothing to
 * wait on. Returns a release function for unmount.
 */
export function expectGpuRoot(): () => void {
  const token = Symbol('gpu-root')
  pending.add(token)
  return () => {
    // No-op if the suite already moved on to the next story and reset us.
    if (pending.delete(token)) onChange?.()
  }
}

/**
 * Wraps `renderer.onError` so uncaptured GPU errors are recorded here in addition
 * to being logged. Safe to call more than once per renderer and on a WebGL renderer
 * (which has no `onError`, so nothing happens beyond releasing the pending slot).
 */
export function attachGpuErrorCapture(root: CapturedRoot, release: () => void): void {
  release()

  const renderer = root.renderer as CapturedRenderer & { [CAPTURED]?: boolean }
  if (!renderer || typeof renderer.onError !== 'function') return

  roots.add(root)
  onChange?.()
  if (renderer[CAPTURED]) return

  const original = renderer.onError
  renderer.onError = function (this: unknown, info: OnErrorInfo) {
    errors.push({
      type: info?.type ?? 'GPUError',
      message: info?.message ?? 'Unknown uncaptured GPU error',
    })
    return original.call(this, info)
  }
  renderer[CAPTURED] = true
}

/** Forget everything recorded so far. Called before each story. */
export function resetGpuErrorCapture(): void {
  errors.length = 0
  pending.clear()
  roots.clear()
}

/** Returns and clears the errors recorded since the last reset. */
export function takeGpuErrors(): GpuError[] {
  return errors.splice(0, errors.length)
}

/** Whether any of the current story's canvases got a real WebGPU device. */
export function hasWebGpuDevice(): boolean {
  for (const { renderer } of roots) if (renderer.backend?.device) return true
  return false
}

//* Settle ==============================

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** How long to wait for a mounted Canvas to produce a renderer before giving up on it. */
const RENDERER_TIMEOUT_MS = 10_000

function waitForPendingRoots(): Promise<void> {
  if (pending.size === 0) return Promise.resolve()
  return new Promise((resolve) => {
    const timer = setTimeout(finish, RENDERER_TIMEOUT_MS)
    function finish() {
      clearTimeout(timer)
      onChange = null
      resolve()
    }
    onChange = () => {
      if (pending.size === 0) finish()
    }
  })
}

/**
 * Wait until every canvas the story mounted has initialised its renderer,
 * rendered at least one frame, and flushed its GPU queue, so that any
 * validation error the story is going to produce has been reported.
 *
 * Stories resolve in a few milliseconds; `requestDevice()` and the first frame
 * happen after that. Without this wait the suite tears the story down before
 * the GPU ever sees its shaders — which is why the errors were sometimes there
 * and sometimes not, depending on how long the tab happened to live.
 */
export async function settleGpu(): Promise<void> {
  await waitForPendingRoots()
  if (roots.size === 0) return

  for (const { renderer, getState } of roots) {
    // r3f already called `init()`; three caches the promise so this just awaits it.
    try {
      await renderer.init?.()
    } catch {
      // Init failures surface through r3f's own error path; nothing to settle.
      continue
    }

    // Let the r3f loop render a frame. When a story froze the loop, step it once.
    const state = getState()
    if (state.frameloop === 'never') state.advance?.(performance.now())
    await nextFrame()
    await nextFrame()

    // Validation happens on the GPU process; wait for submitted work so the
    // uncaptured-error events for this frame have been queued on our side.
    const device = renderer.backend?.device
    if (device) {
      try {
        await device.queue.onSubmittedWorkDone()
      } catch {
        // Device lost — the story's own error path covers that.
      }
    }
  }

  // The `uncapturederror` event dispatches as a task; yield once so it lands.
  await nextTask()
}
