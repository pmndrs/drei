/**
 * Canary Import Tests
 *
 * Purpose: Validate the build output is functional
 * - Entry points can be imported without errors
 * - Key exports exist and are accessible
 * - TypeScript declarations are generated
 *
 * This is a smoke test, not comprehensive validation.
 * Storybook handles visual/functional testing.
 *
 * Run: yarn build && yarn test:canary
 */
import { describe, it, expect } from 'vitest'
import path from 'path'
import { pathToFileURL, fileURLToPath } from 'url'
import { existsSync } from 'fs'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper: Dynamic import from dist folder
async function importDist(entryPath) {
  const fullPath = path.resolve(__dirname, '../../dist', entryPath)
  const fileUrl = pathToFileURL(fullPath).href
  return import(fileUrl)
}

//* Entry Point Tests ==============================

describe('Root Entry - @react-three/drei', () => {
  it('should import without errors', async () => {
    const drei = await importDist('index.mjs')
    expect(drei).toBeDefined()
  })

  it('should export core components', async () => {
    const drei = await importDist('index.mjs')

    // Sample key exports (not exhaustive)
    expect(drei.OrbitControls).toBeDefined()
    expect(drei.Environment).toBeDefined()
    expect(drei.Html).toBeDefined()
    expect(drei.useGLTF).toBeDefined()
  })
})

describe('Core Entry - @react-three/drei/core', () => {
  it('should import without errors', async () => {
    const core = await importDist('core/index.mjs')
    expect(core).toBeDefined()
  })

  it('should export core components', async () => {
    const core = await importDist('core/index.mjs')

    expect(core.OrbitControls).toBeDefined()
    expect(core.Environment).toBeDefined()
  })
})

describe('Legacy Entry - @react-three/drei/legacy', () => {
  it('should import without errors', async () => {
    const legacy = await importDist('legacy/index.mjs')
    expect(legacy).toBeDefined()
  })

  it('should export WebGL-specific materials', async () => {
    const legacy = await importDist('legacy/index.mjs')

    expect(legacy.MeshDistortMaterial).toBeDefined()
    expect(legacy.MeshReflectorMaterial).toBeDefined()
  })
})

describe('WebGPU Entry - @react-three/drei/webgpu', () => {
  it('should import without errors', async () => {
    const webgpu = await importDist('webgpu/index.mjs')
    expect(webgpu).toBeDefined()
  })

  it('should export WebGPU-specific materials', async () => {
    const webgpu = await importDist('webgpu/index.mjs')

    expect(webgpu.MeshTransmissionMaterial).toBeDefined()
    expect(webgpu.Sparkles).toBeDefined()
  })
})

describe('External Entry - @react-three/drei/external', () => {
  it('should import without errors', async () => {
    const external = await importDist('external/index.mjs')
    expect(external).toBeDefined()
  })
})

describe('Experimental Entry - @react-three/drei/experimental', () => {
  it('should import without errors', async () => {
    const experimental = await importDist('experimental/index.mjs')
    expect(experimental).toBeDefined()
  })
})

//* TypeScript Declarations ==============================

describe('TypeScript Declarations', () => {
  it('should have .d.mts files for all entry points', () => {
    const distPath = path.resolve(__dirname, '../../dist')

    const dtsFiles = [
      'index.d.mts',
      'core/index.d.mts',
      'legacy/index.d.mts',
      'webgpu/index.d.mts',
      'external/index.d.mts',
      'experimental/index.d.mts',
    ]

    for (const file of dtsFiles) {
      const fullPath = path.join(distPath, file)
      const exists = existsSync(fullPath)
      expect(exists, `Missing TypeScript declaration: ${file}`).toBe(true)
    }
  })
})
