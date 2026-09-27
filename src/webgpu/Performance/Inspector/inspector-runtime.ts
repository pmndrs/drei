// Browser-only runtime. Load on the client and keep it out of static package exports.
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js'
import { getConsoleFunction, setConsoleFunction } from 'three/webgpu'
import type { Renderer, WebGPURenderer } from 'three/webgpu'

// Timestamp readbacks are not exposed in Three's public types.
type InspectorInternals = {
  _resolveTimestampPromise: Promise<void> | null
}

class FiberInspector extends Inspector {
  private attachment = 0

  setRenderer(renderer: Renderer | null): this {
    const attachment = ++this.attachment
    const readback = (this as unknown as InspectorInternals)._resolveTimestampPromise
    // Keep the renderer available to pending readbacks. Newer attachments retain ownership.
    if (!renderer && readback) {
      const detach = () => {
        if (this.attachment === attachment) super.setRenderer(null!)
      }
      void readback.then(detach, detach)
    } else super.setRenderer(renderer!)
    return this
  }

  // R3F frame phases drive profiling. Ignore Three's separate animation loop.
  begin() {}
  finish() {}

  beginFrame() {
    super.begin()
  }

  finishFrame() {
    if (this.currentFrame) super.finish()
  }
}

// Reuse each renderer's UI across remounts to avoid duplicating global listeners.
const inspectors = new WeakMap<WebGPURenderer, FiberInspector>()
const active = new WeakMap<WebGPURenderer, object>()
const pending = new WeakMap<WebGPURenderer, Promise<void>>()
type ConsoleHandler = ReturnType<typeof getConsoleFunction>
const consoleHandlers = new WeakMap<ConsoleHandler, { previous: ConsoleHandler; active: boolean }>()

function previousActiveConsole(handler: ConsoleHandler): ConsoleHandler {
  let entry = consoleHandlers.get(handler)
  while (entry && !entry.active) {
    handler = entry.previous
    entry = consoleHandlers.get(handler)
  }
  return handler
}

export interface InspectorSession {
  inspector: Inspector
  begin(): void
  finish(): void
  release(): void
}

export async function attachInspector(
  renderer: WebGPURenderer,
  eventSource: EventTarget | undefined,
  signal?: AbortSignal
): Promise<InspectorSession> {
  await pending.get(renderer)
  signal?.throwIfAborted()
  if (active.has(renderer)) throw new Error('Only one <Inspector> can be mounted per renderer.')

  if (
    !(eventSource instanceof HTMLElement) ||
    !eventSource.parentElement ||
    eventSource === eventSource.ownerDocument.body
  ) {
    throw new Error(
      'Inspector requires an element event source with a parent. Document and body event sources are not supported.'
    )
  }

  const owner = {}
  const current = inspectors.get(renderer) ?? new FiberInspector()
  inspectors.set(renderer, current)
  const internals = current as unknown as InspectorInternals
  const previous = renderer.inspector
  const previousConsole = getConsoleFunction()
  const backend = renderer.backend as typeof renderer.backend & { trackTimestamp: boolean }
  const previousTracking = backend.trackTimestamp
  let inspectorConsole: ConsoleHandler
  const consoleEntry = { previous: previousConsole, active: true }
  try {
    renderer.inspector = current
    inspectorConsole = getConsoleFunction()
    consoleHandlers.set(inspectorConsole, consoleEntry)
    // Sibling UI events can reach document listeners without entering the scene event source.
    // Mount before initialization to prevent automatic placement inside the canvas wrapper.
    eventSource.after(current.domElement)
    current.init()
  } catch (error) {
    consoleEntry.active = false
    current.domElement.remove()
    if (renderer.inspector === current) renderer.inspector = previous
    setConsoleFunction(previousConsole)
    // Three queues its tracking flag update even on an initialized renderer.
    await renderer.init()
    if (renderer.inspector === previous) backend.trackTimestamp = previousTracking
    throw error
  }
  active.set(renderer, owner)

  let released = false

  return {
    inspector: current,
    begin: () => {
      if (!released && renderer.inspector === current) current.beginFrame()
    },
    finish: () => {
      if (!released && renderer.inspector === current) current.finishFrame()
    },
    release() {
      if (released) return
      released = true
      consoleEntry.active = false
      current.finishFrame()
      current.domElement.remove()
      if (getConsoleFunction() === inspectorConsole) setConsoleFunction(previousActiveConsole(previousConsole))

      if (active.get(renderer) === owner) {
        active.delete(renderer)
        if (renderer.inspector === current) {
          // Assign through Three's setter to detach the current inspector.
          renderer.inspector = previous
          if (getConsoleFunction() === inspectorConsole) setConsoleFunction(previousActiveConsole(previousConsole))
        }
      }
      const finishCleanup = () => {
        if (renderer.inspector === previous) backend.trackTimestamp = previousTracking
      }
      // A new attachment must wait until old readbacks no longer use this instance.
      if (internals._resolveTimestampPromise) {
        pending.set(
          renderer,
          internals._resolveTimestampPromise.then(finishCleanup, finishCleanup).finally(() => pending.delete(renderer))
        )
      } else finishCleanup()
    },
  }
}
