/**
 * Canary Import Tests
 * 
 * These tests verify that the built package can be imported correctly.
 * They catch:
 * - Export map issues (package.json exports field)
 * - Missing exports
 * - CJS/ESM compatibility problems
 * - Bundler-visible import errors
 * 
 * Run after build: yarn build && yarn test:canary
 */
import { describe, it, expect } from 'vitest';
import path from 'path';
import { pathToFileURL } from 'url';

//* Helper ==============================

// Dynamic import from dist folder (ESM)
async function importDist(entryPath: string) {
  const fullPath = path.resolve(__dirname, '../../dist', entryPath);
  const fileUrl = pathToFileURL(fullPath).href;
  return import(fileUrl);
}

//* Root Entry (@react-three/drei) ==============================

describe('Root Entry - @react-three/drei', () => {
  it('should export core components', async () => {
    const drei = await importDist('index.js');
    
    // Controls
    expect(drei.OrbitControls).toBeDefined();
    expect(drei.MapControls).toBeDefined();
    expect(drei.CameraControls).toBeDefined();
    
    // Staging
    expect(drei.Environment).toBeDefined();
    expect(drei.Stage).toBeDefined();
    expect(drei.Center).toBeDefined();
    
    // Abstractions
    expect(drei.Billboard).toBeDefined();
    expect(drei.Text).toBeDefined();
    expect(drei.Html).toBeDefined();
    
    // Shapes
    expect(drei.Sphere).toBeDefined();
    expect(drei.Box).toBeDefined();
    expect(drei.Plane).toBeDefined();
  });

  it('should export hooks', async () => {
    const drei = await importDist('index.js');
    
    expect(drei.useGLTF).toBeDefined();
    expect(drei.useTexture).toBeDefined();
    expect(drei.useCursor).toBeDefined();
  });
});

//* Core Entry (@react-three/drei/core) ==============================

describe('Core Entry - @react-three/drei/core', () => {
  it('should export core components', async () => {
    const core = await importDist('core/index.js');
    
    expect(core.OrbitControls).toBeDefined();
    expect(core.Environment).toBeDefined();
    expect(core.Center).toBeDefined();
    expect(core.Billboard).toBeDefined();
  });
});

//* Legacy Entry (@react-three/drei/legacy) ==============================

describe('Legacy Entry - @react-three/drei/legacy', () => {
  it('should export WebGL-specific materials', async () => {
    const legacy = await importDist('legacy/index.js');
    
    // Legacy-specific materials
    expect(legacy.MeshDistortMaterial).toBeDefined();
    expect(legacy.MeshReflectorMaterial).toBeDefined();
    expect(legacy.MeshTransmissionMaterial).toBeDefined();
    expect(legacy.MeshRefractionMaterial).toBeDefined();
  });

  it('should export legacy effects', async () => {
    const legacy = await importDist('legacy/index.js');
    
    expect(legacy.Sparkles).toBeDefined();
    expect(legacy.Segments).toBeDefined();
  });
});

//* WebGPU Entry (@react-three/drei/webgpu) ==============================

describe('WebGPU Entry - @react-three/drei/webgpu', () => {
  it('should export WebGPU-specific materials', async () => {
    const webgpu = await importDist('webgpu/index.js');
    
    // WebGPU-specific materials (TSL-based)
    expect(webgpu.MeshTransmissionMaterial).toBeDefined();
    expect(webgpu.MeshRefractionMaterial).toBeDefined();
  });

  it('should export WebGPU-specific components', async () => {
    const webgpu = await importDist('webgpu/index.js');
    
    expect(webgpu.Sparkles).toBeDefined();
    expect(webgpu.Line).toBeDefined();
  });
});

//* External Entry (@react-three/drei/external) ==============================

describe('External Entry - @react-three/drei/external', () => {
  it('should export external components', async () => {
    const external = await importDist('external/index.js');
    
    // External components should be defined (even if empty)
    expect(external).toBeDefined();
  });
});

//* Experimental Entry (@react-three/drei/experimental) ==============================

describe('Experimental Entry - @react-three/drei/experimental', () => {
  it('should export experimental components', async () => {
    const experimental = await importDist('experimental/index.js');
    
    // Experimental components should be defined (even if empty)
    expect(experimental).toBeDefined();
  });
});

//* CJS Compatibility ==============================

describe('CJS Compatibility', () => {
  it('should have CJS entry points', async () => {
    // Just verify the files exist and can be resolved
    const fs = await import('fs');
    const distPath = path.resolve(__dirname, '../../dist');
    
    const cjsFiles = [
      'index.cjs.js',
      'core/index.cjs.js',
      'legacy/index.cjs.js',
      'webgpu/index.cjs.js',
      'external/index.cjs.js',
      'experimental/index.cjs.js',
    ];
    
    for (const file of cjsFiles) {
      const fullPath = path.join(distPath, file);
      const exists = fs.existsSync(fullPath);
      expect(exists, `CJS file should exist: ${file}`).toBe(true);
    }
  });
});

//* TypeScript Declarations ==============================

describe('TypeScript Declarations', () => {
  it('should have .d.ts files for all entries', async () => {
    const fs = await import('fs');
    const distPath = path.resolve(__dirname, '../../dist');
    
    const dtsFiles = [
      'index.d.ts',
      'core/index.d.ts',
      'legacy/index.d.ts',
      'webgpu/index.d.ts',
      'external/index.d.ts',
      'experimental/index.d.ts',
    ];
    
    for (const file of dtsFiles) {
      const fullPath = path.join(distPath, file);
      const exists = fs.existsSync(fullPath);
      expect(exists, `TypeScript declaration should exist: ${file}`).toBe(true);
    }
  });
});

