#!/usr/bin/env ts-node
/**
 * Fix Three.js Imports
 * 
 * Automatically converts 'three' imports to '#three' in core/external/experimental components.
 * 
 * Usage:
 *   npx ts-node scripts/fix-imports.ts src/core/Cameras/OrthographicCamera/OrthographicCamera.tsx
 *   npx ts-node scripts/fix-imports.ts src/core/Controls  (entire folder)
 *   npx ts-node scripts/fix-imports.ts --all-core         (all core components)
 */

import fs from 'fs'
import path from 'path'

//* Configuration ==============================

const TIERS_TO_FIX = ['core', 'external', 'experimental']

// Patterns to replace
const PATTERNS = [
  {
    // Standard three import
    regex: /from ['"]three['"]/g,
    replacement: "from '#three'"
  },
  {
    // three/addons imports - keep as is
    regex: /from ['"]three\/addons\//g,
    replacement: "from 'three/addons/" // no change
  },
  {
    // three/examples imports - keep as is
    regex: /from ['"]three\/examples\//g,
    replacement: "from 'three/examples/" // no change
  }
]

//* Helper Functions ==============================

function shouldFixFile(filePath: string): boolean {
  // Only fix .ts and .tsx files
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return false
  }
  
  // Skip test files for now
  if (filePath.includes('.test.')) {
    return false
  }
  
  // Check if in tier that should be fixed
  const normalized = path.normalize(filePath)
  const parts = normalized.split(path.sep)
  const srcIndex = parts.indexOf('src')
  
  if (srcIndex === -1) return false
  
  const tier = parts[srcIndex + 1]
  return TIERS_TO_FIX.includes(tier)
}

function fixFileImports(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    return false
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  let modified = content
  let changesMade = false
  
  // Apply each pattern
  for (const pattern of PATTERNS) {
    const newContent = modified.replace(pattern.regex, pattern.replacement)
    if (newContent !== modified) {
      changesMade = true
      modified = newContent
    }
  }
  
  if (changesMade) {
    fs.writeFileSync(filePath, modified, 'utf-8')
    console.log(`✅ Fixed: ${filePath}`)
    return true
  } else {
    console.log(`⏭️  Skipped: ${filePath} (no changes needed)`)
    return false
  }
}

function getAllFilesInDir(dir: string): string[] {
  const files: string[] = []
  
  if (!fs.existsSync(dir)) {
    return files
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      // Skip node_modules, dist, etc.
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        continue
      }
      files.push(...getAllFilesInDir(fullPath))
    } else if (entry.isFile()) {
      if (shouldFixFile(fullPath)) {
        files.push(fullPath)
      }
    }
  }
  
  return files
}

function fixAllInTier(tier: string): number {
  const tierPath = path.join('src', tier)
  console.log(`\n🔧 Fixing all files in ${tierPath}...`)
  
  const files = getAllFilesInDir(tierPath)
  console.log(`Found ${files.length} files to check\n`)
  
  let fixed = 0
  files.forEach(file => {
    if (fixFileImports(file)) {
      fixed++
    }
  })
  
  return fixed
}

//* Main ==============================

function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
Usage:
  Fix specific file:
    npx ts-node scripts/fix-imports.ts src/core/Cameras/OrthographicCamera/OrthographicCamera.tsx

  Fix entire folder:
    npx ts-node scripts/fix-imports.ts src/core/Cameras

  Fix all core:
    npx ts-node scripts/fix-imports.ts --all-core

  Fix all external:
    npx ts-node scripts/fix-imports.ts --all-external

  Fix all experimental:
    npx ts-node scripts/fix-imports.ts --all-experimental

  Fix everything:
    npx ts-node scripts/fix-imports.ts --all

What it does:
  - Changes: import { X } from 'three' → import { X } from '#three'
  - Skips: three/addons and three/examples imports (left as-is)
  - Only affects: core, external, experimental tiers
`)
    process.exit(1)
  }
  
  const target = args[0]
  
  // Fix all mode
  if (target === '--all') {
    console.log('\n🚀 Fixing imports in all tiers...\n')
    let totalFixed = 0
    
    for (const tier of TIERS_TO_FIX) {
      totalFixed += fixAllInTier(tier)
    }
    
    console.log(`\n✅ Total files fixed: ${totalFixed}\n`)
    process.exit(0)
  }
  
  // Fix specific tier
  if (target === '--all-core') {
    const fixed = fixAllInTier('core')
    console.log(`\n✅ Fixed ${fixed} files in core\n`)
    process.exit(0)
  }
  
  if (target === '--all-external') {
    const fixed = fixAllInTier('external')
    console.log(`\n✅ Fixed ${fixed} files in external\n`)
    process.exit(0)
  }
  
  if (target === '--all-experimental') {
    const fixed = fixAllInTier('experimental')
    console.log(`\n✅ Fixed ${fixed} files in experimental\n`)
    process.exit(0)
  }
  
  // Fix specific file or folder
  const targetPath = path.resolve(target)
  const stats = fs.statSync(targetPath)
  
  if (stats.isDirectory()) {
    const files = getAllFilesInDir(targetPath)
    console.log(`\n🔧 Found ${files.length} files in ${targetPath}\n`)
    
    let fixed = 0
    files.forEach(file => {
      if (fixFileImports(file)) {
        fixed++
      }
    })
    
    console.log(`\n✅ Fixed ${fixed} files\n`)
  } else {
    // Single file
    const success = fixFileImports(targetPath)
    console.log()
    process.exit(success ? 0 : 1)
  }
}

main()


