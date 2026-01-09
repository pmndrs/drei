import path from 'path'
import fs from 'fs'

/**
 * Rollup Plugin: WebGPU Override Resolver
 *
 * This plugin enables a file override system for the WebGPU build.
 * When building the WebGPU version of Drei, certain components need
 * platform-specific implementations (e.g., render targets, FBOs).
 *
 * How it works:
 * - Place WebGPU-specific implementations in src/webgpu/ matching the src/ structure
 * - During WebGPU build, imports are automatically redirected to webgpu versions when they exist
 * - If no override exists, the default src/ file is used
 *
 * Example:
 *   src/core/Fbo.tsx           (WebGL implementation)
 *   src/webgpu/core/Fbo.tsx    (WebGPU implementation)
 *   src/core/Camera.tsx        (Works for both - no override needed)
 *
 * When Camera.tsx imports './Fbo', the WebGPU build will automatically
 * resolve to src/webgpu/core/Fbo.tsx instead of src/core/Fbo.tsx
 *
 * @param {Object} options - Plugin options
 * @param {boolean} options.verbose - Enable logging for debugging
 * @returns {Object} Rollup plugin
 */
export default function webgpuOverrideResolver(options = {}) {
  const { verbose = false } = options
  const extensions = ['.tsx', '.ts', '.jsx', '.js']

  return {
    name: 'webgpu-override-resolver',

    resolveId(source, importer) {
      // Only handle relative imports from within the source directory
      if (!importer || !source.startsWith('.')) {
        return null
      }

      // Don't process if we're already in a webgpu override file
      if (importer.includes('/webgpu/') || importer.includes('\\webgpu\\')) {
        return null
      }

      // Resolve the default path
      const importerDir = path.dirname(importer)
      const resolvedPath = path.resolve(importerDir, source)

      // Check for webgpu overrides with all possible extensions
      for (const ext of extensions) {
        const pathWithExt = resolvedPath.endsWith(ext) ? resolvedPath : resolvedPath + ext

        // Convert src/ path to src/webgpu/ path
        // Handle both forward slashes (Unix) and backslashes (Windows)
        const overridePath = pathWithExt.replace(
          new RegExp(`${path.sep}src${path.sep}`),
          `${path.sep}src${path.sep}webgpu${path.sep}`
        )

        if (fs.existsSync(overridePath)) {
          if (verbose) {
            const relativePath = path.relative(process.cwd(), overridePath)
            console.log(`[WebGPU Override] ${source} → ${relativePath}`)
          }
          return overridePath
        }
      }

      // No override found, let Rollup handle normal resolution
      return null
    },
  }
}
