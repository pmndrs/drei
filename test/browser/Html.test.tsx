import * as React from 'react'
import { flushSync as flushDOM } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { createRoot as createThreeRoot, extend, flushSync } from '@react-three/fiber/legacy'
import { Group, WebGLRenderer } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { createRoot as createWebGPURoot } from '@react-three/fiber'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Html } from '../../src/core/UI/Html/Html'

extend({ Group })
let container: HTMLDivElement
let root: Root
let sceneRoot: ReturnType<typeof createThreeRoot>
let renderer: WebGLRenderer | WebGPURenderer
let activeLabels: number
let errors: ReturnType<typeof vi.spyOn>

describe.each(['WebGLRenderer', 'WebGPURenderer'])('%s', (rendererType) => {
  beforeEach(async () => {
    activeLabels = 0
    container = document.createElement('div')
    document.body.appendChild(container)
    const canvas = document.createElement('canvas')
    container.appendChild(canvas)
    const config = { frameloop: 'never' as const, size: { width: 300, height: 300, top: 0, left: 0 } }
    if (rendererType === 'WebGLRenderer') {
      renderer = new WebGLRenderer({ canvas })
      sceneRoot = createThreeRoot(canvas)
      await sceneRoot.configure({ ...config, gl: renderer })
    } else {
      // Exercise WebGPURenderer's supported WebGL backend without requiring a
      // native GPU adapter on CI. Html's lifecycle is independent of the backend.
      renderer = new WebGPURenderer({ canvas, forceWebGL: true })
      await renderer.init()
      sceneRoot = createWebGPURoot(canvas)
      await sceneRoot.configure({ ...config, renderer })
    }
    root = createRoot(document.createElement('div'))
    errors = vi.spyOn(console, 'error')
  })

  afterEach(async () => {
    try {
      root.unmount()
      await expect.poll(() => activeLabels).toBe(0)
      expectNoRootWarnings()
    } finally {
      sceneRoot.unmount()
      renderer.dispose()
      container.remove()
      errors.mockRestore()
    }
  })

  function Label({ index }: { index: number }) {
    const [clicks, setClicks] = React.useState(0)
    React.useEffect(() => {
      activeLabels++
      return () => {
        activeLabels--
      }
    }, [])
    return (
      <button data-label={index} onClick={() => setClicks((value) => value + 1)}>
        Label {index}: {clicks}
      </button>
    )
  }

  function Labels({
    visible = true,
    transform = false,
    portal,
  }: {
    visible?: boolean
    transform?: boolean
    portal?: React.RefObject<HTMLElement>
  }) {
    // Reproduce a scene commit nested in a DOM commit, as happens when Canvas
    // mounts synchronously inside a layout effect. Both renderers are real.
    React.useLayoutEffect(() => {
      flushSync(() =>
        sceneRoot.render(
          <React.StrictMode>
            {visible &&
              Array.from({ length: 3 }, (_, index) => (
                <Html key={index} transform={transform} portal={portal}>
                  <Label index={index} />
                </Html>
              ))}
          </React.StrictMode>
        )
      )
    }, [visible, transform, portal])
    React.useLayoutEffect(
      () => () => {
        flushSync(() => sceneRoot.render(null))
      },
      []
    )
    return null
  }

  function expectNoRootWarnings() {
    expect(
      errors.mock.calls
        .flat()
        .map(String)
        .filter((message) =>
          /synchronously unmount a root|already been passed to createRoot|unmounted root|NotFoundError/.test(message)
        )
    ).toEqual([])
  }

  test.each([false, true])('labels mount and clean up safely with StrictMode=%s', async (strict) => {
    const labels = <Labels />
    root.render(strict ? <React.StrictMode>{labels}</React.StrictMode> : labels)
    await expect.poll(() => activeLabels).toBe(3)
    expect(container.querySelectorAll('[data-label]').length).toBe(3)
  })

  test('removing and remounting labels releases the old roots without losing new content', async () => {
    root.render(<Labels />)
    await expect.poll(() => activeLabels).toBe(3)
    root.render(<Labels visible={false} />)
    await expect.poll(() => activeLabels).toBe(0)
    expect(container.querySelector('[data-label]')).toBeNull()
    root.render(<Labels />)
    await expect.poll(() => activeLabels).toBe(3)
    expect(container.querySelectorAll('[data-label]').length).toBe(3)
  })

  test('an immediate remount survives teardown of the previous labels', async () => {
    root.render(<Labels />)
    await expect.poll(() => activeLabels).toBe(3)
    flushDOM(() => root.render(<Labels visible={false} />))
    flushDOM(() => root.render(<Labels />))
    await expect.poll(() => activeLabels).toBe(3)
    expect(container.querySelectorAll('[data-label]').length).toBe(3)
  })

  test('moving labels to another portal preserves their DOM and child state', async () => {
    const target = document.createElement('div')
    container.appendChild(target)
    root.render(<Labels />)
    await expect.poll(() => activeLabels).toBe(3)
    const button = container.querySelector<HTMLButtonElement>('[data-label="0"]')!
    button.click()
    await expect.poll(() => button.textContent).toBe('Label 0: 1')
    root.render(<Labels portal={{ current: target }} />)
    await expect.poll(() => target.querySelectorAll('[data-label]').length).toBe(3)
    expect(target.querySelector('[data-label="0"]')).toBe(button)
    expect(button.textContent).toBe('Label 0: 1')
  })

  test('switching transform mode keeps all labels mounted and tears down the final children', async () => {
    root.render(<Labels />)
    await expect.poll(() => activeLabels).toBe(3)
    root.render(<Labels transform />)
    await expect
      .poll(() => container.querySelector('[data-label]')?.parentElement?.parentElement?.style.pointerEvents)
      .toBe('auto')
    await expect.poll(() => activeLabels).toBe(3)
    root.render(<Labels />)
    await expect.poll(() => container.querySelector('[data-label]')?.parentElement?.style.transform).toBe('none')
    expect(container.querySelectorAll('[data-label]').length).toBe(3)
  })
})
