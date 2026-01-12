/**
 * Canary Import Tests
 *
 * These tests verify that the built package can be imported correctly.
 * They catch:
 * - Export map issues (package.json exports field)
 * - Missing exports
 * - ESM compatibility problems
 * - Bundler-visible import errors
 *
 * Run after build: yarn build && yarn test:canary
 */
import { describe, it, expect } from 'vitest'
import path from 'path'
import { pathToFileURL } from 'url'

//* Helper ==============================

// Dynamic import from dist folder (ESM)
async function importDist(entryPath: string) {
  const fullPath = path.resolve(__dirname, '../../dist', entryPath)
  const fileUrl = pathToFileURL(fullPath).href
  return import(fileUrl)
}

//* Root Entry (@react-three/drei) ==============================

describe('Root Entry - @react-three/drei', () => {
  it('should export core components', async () => {
    const drei = await importDist('index.mjs')

    // Controls
    expect(drei.OrbitControls).toBeDefined()
    expect(drei.MapControls).toBeDefined()
    expect(drei.CameraControls).toBeDefined()

    // Staging
    expect(drei.Environment).toBeDefined()
    expect(drei.Stage).toBeDefined()
    expect(drei.Center).toBeDefined()

    // Abstractions
    expect(drei.Billboard).toBeDefined()
    expect(drei.Html).toBeDefined()

    // Shapes
    expect(drei.Sphere).toBeDefined()
    expect(drei.Box).toBeDefined()
    expect(drei.Plane).toBeDefined()
  })

  it('should export hooks', async () => {
    const drei = await importDist('index.mjs')

    expect(drei.useGLTF).toBeDefined()
    expect(drei.useTexture).toBeDefined()
    expect(drei.useCursor).toBeDefined()
  })
})

//* Core Entry (@react-three/drei/core) ==============================

describe('Core Entry - @react-three/drei/core', () => {
  it('should export core components', async () => {
    // obuild nests: core/core/
    const core = await importDist('core/core/index.mjs')

    expect(core.OrbitControls).toBeDefined()
    expect(core.Environment).toBeDefined()
    expect(core.Center).toBeDefined()
    expect(core.Billboard).toBeDefined()
  })
})

//* Legacy Entry (@react-three/drei/legacy) ==============================

describe('Legacy Entry - @react-three/drei/legacy', () => {
  it('should export WebGL-specific materials', async () => {
    // obuild nests: legacy/legacy/
    const legacy = await importDist('legacy/legacy/index.mjs')

    // Legacy-specific materials
    expect(legacy.MeshDistortMaterial).toBeDefined()
    expect(legacy.MeshReflectorMaterial).toBeDefined()
    expect(legacy.MeshTransmissionMaterial).toBeDefined()
    expect(legacy.MeshRefractionMaterial).toBeDefined()
  })

  it('should export legacy effects', async () => {
    // obuild nests: legacy/legacy/
    const legacy = await importDist('legacy/legacy/index.mjs')

    expect(legacy.Sparkles).toBeDefined()
    expect(legacy.Segments).toBeDefined()
  })
})

//* WebGPU Entry (@react-three/drei/webgpu) ==============================

describe('WebGPU Entry - @react-three/drei/webgpu', () => {
  it('should export WebGPU-specific materials', async () => {
    // obuild nests: webgpu/webgpu/
    const webgpu = await importDist('webgpu/webgpu/index.mjs')

    // WebGPU-specific materials (TSL-based)
    expect(webgpu.MeshTransmissionMaterial).toBeDefined()
    expect(webgpu.MeshRefractionMaterial).toBeDefined()
  })

  it('should export WebGPU-specific components', async () => {
    // obuild nests: webgpu/webgpu/
    const webgpu = await importDist('webgpu/webgpu/index.mjs')

    expect(webgpu.Sparkles).toBeDefined()
    expect(webgpu.Line).toBeDefined()
  })
})

//* External Entry (@react-three/drei/external) ==============================

describe('External Entry - @react-three/drei/external', () => {
  it('should export external components', async () => {
    // obuild nests: external/external/
    const external = await importDist('external/external/index.mjs')

    // External components should be defined (even if empty)
    expect(external).toBeDefined()
  })
})

//* Experimental Entry (@react-three/drei/experimental) ==============================

describe('Experimental Entry - @react-three/drei/experimental', () => {
  it('should export experimental components', async () => {
    // obuild nests: experimental/experimental/
    const experimental = await importDist('experimental/experimental/index.mjs')

    // Experimental components should be defined (even if empty)
    expect(experimental).toBeDefined()
  })
})

//* TypeScript Declarations ==============================

describe('TypeScript Declarations', () => {
  it('should have .d.mts files for all entries', async () => {
    const fs = await import('fs')
    const distPath = path.resolve(__dirname, '../../dist')

    // obuild nests entry points in subdirectories
    const dtsFiles = [
      'index.d.mts',
      'core/core/index.d.mts',
      'legacy/legacy/index.d.mts',
      'webgpu/webgpu/index.d.mts',
      'external/external/index.d.mts',
      'experimental/experimental/index.d.mts',
    ]

    for (const file of dtsFiles) {
      const fullPath = path.join(distPath, file)
      const exists = fs.existsSync(fullPath)
      expect(exists, `TypeScript declaration should exist: ${file}`).toBe(true)
    }
  })
})
