import { afterEach, beforeEach } from 'vitest'
import { setProjectAnnotations } from '@storybook/react-vite'
import * as projectAnnotations from './preview'
import {
  hasWebGpuDevice,
  isKnownEnvironmentalGpuError,
  resetGpuErrorCapture,
  settleGpu,
  takeGpuErrors,
} from './gpuErrors'

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([projectAnnotations])

//* Uncaptured WebGPU errors ==============================
// Every story renders on a real WebGPU device. A shader that fails to compile
// used to pass silently (#2817). `Setup` records the device's uncaptured errors;
// with DREI_STRICT_GPU=1 we wait for the story's first frame to reach the GPU,
// then fail the story on anything that is not a known environmental error
// (see `gpuErrors.ts`).
//
// Strict mode is opt-in for now. A story's test resolves in milliseconds, before
// `requestDevice()` returns, so the wait is what makes the errors observable at
// all — and keeping a story alive long enough to hit the GPU also surfaces
// loader failures that used to be torn down unseen (Environment "Gainmap" on
// WebGPU, for one). Until the stories that fail for real are fixed, the default
// run keeps its old timing and only reports whatever arrived on its own.

// `vite/client` types are not in the typecheck's lib set, hence the cast.
const strict = (import.meta as { env?: Record<string, string | undefined> }).env?.DREI_STRICT_GPU === '1'

beforeEach(() => {
  resetGpuErrorCapture()
})

afterEach(async (context) => {
  if (strict) await settleGpu()

  const errors = takeGpuErrors()
  const unexpected = errors.filter((error) => !isKnownEnvironmentalGpuError(error))
  if (unexpected.length === 0) return

  const storyId = (context.task.meta as { storyId?: string }).storyId ?? context.task.name
  const lines = unexpected.map((error) => `  - ${error.type}: ${error.message.trim()}`)
  const summary =
    `${unexpected.length} uncaptured WebGPU error${unexpected.length === 1 ? '' : 's'} in story "${storyId}"` +
    (errors.length > unexpected.length ? ` (${errors.length - unexpected.length} allowlisted, not shown)` : '') +
    (hasWebGpuDevice() ? '' : ' [no WebGPU device]') +
    `:\n${lines.join('\n')}`

  if (strict) throw new Error(summary)
  console.error(`[gpu-errors] ${summary}\n  (set DREI_STRICT_GPU=1 to fail the story)`)
})
