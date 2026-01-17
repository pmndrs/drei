#!/usr/bin/env node

//* Docs Generation Config ==============================
// Configuration for TSDoc to MDX documentation generation

import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Source Directories --------------------------------------
// Maps component category folders to their doc output folders
export const docCategories = {
  Abstractions: 'abstractions',
  Cameras: 'cameras',
  Controls: 'controls',
  Effects: 'effects',
  Geometry: 'shapes',
  Gizmos: 'gizmos',
  Helpers: 'misc',
  Lights: 'staging',
  Loaders: 'loaders',
  Performance: 'performances',
  Portal: 'portals',
  Staging: 'staging',
  Materials: 'shaders',
}

// Tiers to process (folders under src/)
export const tiers = ['core', 'web', 'external', 'experimental']

// Injection Tags --------------------------------------
// Tags that can be used in .docs.mdx templates to inject auto-generated content
export const injectionTags = [
  'AUTO:description', // Component description from TSDoc
  'AUTO:example', // @example blocks from TSDoc
  'AUTO:props', // Props table generated from types
  'AUTO:badges', // Storybook/suspense badges
  'AUTO:all', // All of the above in default order
]

// Paths --------------------------------------
export const paths = {
  src: path.resolve(__dirname, '../src'),
  docs: path.resolve(__dirname, '../docs'),
  scripts: __dirname,
}

// Badge Templates --------------------------------------
export const badges = {
  storybook: (storyPath) =>
    `[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/${storyPath})`,
  suspense: '[![](https://img.shields.io/badge/-suspense-brightgreen)](https://r3f.docs.pmnd.rs/api/hooks#useloader)',
  domOnly: '![](https://img.shields.io/badge/-Dom%20only-red)',
  native: '![](https://img.shields.io/badge/-native-yellow)',
}

// Component Metadata Overrides --------------------------------------
// For components that need special handling or metadata not derivable from TSDoc
export const componentOverrides = {
  // Example overrides - add as needed
  // 'Html': { domOnly: true },
  // 'useGLTF': { suspense: true },
}

// File Patterns --------------------------------------
export const filePatterns = {
  component: /^[A-Z][a-zA-Z0-9]*\.tsx$/,
  docsTemplate: /\.docs\.mdx$/,
  story: /\.stories\.tsx$/,
}

// Name Conversion Utilities --------------------------------------
/**
 * Convert PascalCase/camelCase to kebab-case for doc filenames.
 * Examples:
 *   - AsciiRenderer -> ascii-renderer
 *   - CameraShake -> camera-shake
 *   - useGLTF -> use-gltf
 *   - Text3D -> text3d
 */
export function toKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Add hyphen between camelCase boundaries
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Handle consecutive caps like GLTF -> gltf
    .toLowerCase()
}

/**
 * Generate the output filename for a component's documentation.
 */
export function getDocFileName(componentName) {
  return `${toKebabCase(componentName)}.mdx`
}
