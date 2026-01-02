#!/usr/bin/env ts-node
/**
 * Find Old Flat Files
 * 
 * Lists all flat .tsx/.ts files in tier directories that should
 * have been migrated to CaaF structure (Component-as-a-Folder).
 * 
 * Usage:
 *   npx ts-node scripts/find-old-files.ts
 *   npx ts-node scripts/find-old-files.ts --delete  (WARNING: destructive!)
 */

import fs from 'fs'
import path from 'path'

//* Configuration ==============================

const TIERS_TO_CHECK = ['core', 'external', 'experimental']

// Files we should keep (not components)
const WHITELIST = [
  'index.ts',
  'index.tsx',
]

// Folders to skip
const SKIP_FOLDERS = [
  'types',
  'utils',
  'native',
  'web',
  'gl',  // old GL folder - handle separately
  'demos',
  'environment',
  'shapes',
  'portals',
  'gizmo',
  'pivotControls',
  'materials',
  'glsl',
  'loaders',
]

//* Helper Functions ==============================

interface OldFile {
  path: string
  tier: string
  basename: string
  size: number
}

function findOldFiles(tierPath: string, tier: string): OldFile[] {
  const oldFiles: OldFile[] = []
  
  if (!fs.existsSync(tierPath)) {
    return oldFiles
  }
  
  const entries = fs.readdirSync(tierPath, { withFileTypes: true })
  
  for (const entry of entries) {
    // Skip folders
    if (entry.isDirectory()) {
      continue
    }
    
    // Only look at .ts and .tsx files
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
      continue
    }
    
    // Skip whitelisted files
    if (WHITELIST.includes(entry.name)) {
      continue
    }
    
    // This is likely an old flat component file
    const fullPath = path.join(tierPath, entry.name)
    const stats = fs.statSync(fullPath)
    
    oldFiles.push({
      path: fullPath,
      tier,
      basename: entry.name,
      size: stats.size
    })
  }
  
  return oldFiles
}

function checkIfInCategory(filePath: string): boolean {
  // Check if this component exists in a CaaF folder
  const basename = path.basename(filePath, path.extname(filePath))
  const tier = filePath.split(path.sep)[1] // src/[tier]/...
  
  // Look for matching component folder in any category
  const tierPath = path.join('src', tier)
  if (!fs.existsSync(tierPath)) return false
  
  const categories = fs.readdirSync(tierPath, { withFileTypes: true })
    .filter(e => e.isDirectory() && !SKIP_FOLDERS.includes(e.name))
  
  for (const category of categories) {
    const categoryPath = path.join(tierPath, category.name)
    const componentPath = path.join(categoryPath, basename)
    
    if (fs.existsSync(componentPath) && fs.statSync(componentPath).isDirectory()) {
      return true
    }
  }
  
  return false
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

//* Main ==============================

function main() {
  const args = process.argv.slice(2)
  const shouldDelete = args.includes('--delete')
  
  console.log('\n🔍 Scanning for old flat files...\n')
  
  const allOldFiles: OldFile[] = []
  
  for (const tier of TIERS_TO_CHECK) {
    const tierPath = path.join('src', tier)
    const oldFiles = findOldFiles(tierPath, tier)
    allOldFiles.push(...oldFiles)
  }
  
  if (allOldFiles.length === 0) {
    console.log('✅ No old flat files found! Everything is in CaaF structure.\n')
    process.exit(0)
  }
  
  // Categorize files
  const migratedFiles: OldFile[] = []
  const notMigratedFiles: OldFile[] = []
  
  for (const file of allOldFiles) {
    if (checkIfInCategory(file.path)) {
      migratedFiles.push(file)
    } else {
      notMigratedFiles.push(file)
    }
  }
  
  // Report
  console.log(`📊 Summary:`)
  console.log(`   Total old flat files: ${allOldFiles.length}`)
  console.log(`   ✅ Already in CaaF (safe to delete): ${migratedFiles.length}`)
  console.log(`   ⚠️  Not yet migrated: ${notMigratedFiles.length}\n`)
  
  if (migratedFiles.length > 0) {
    console.log(`\n🗑️  Files safe to delete (already in CaaF):\n`)
    let totalSize = 0
    
    migratedFiles.forEach(file => {
      console.log(`   ${file.path} (${formatBytes(file.size)})`)
      totalSize += file.size
    })
    
    console.log(`\n   Total: ${formatBytes(totalSize)}`)
  }
  
  if (notMigratedFiles.length > 0) {
    console.log(`\n⚠️  Files NOT yet in CaaF (keep for now):\n`)
    
    notMigratedFiles.forEach(file => {
      console.log(`   ${file.path}`)
    })
  }
  
  // Delete mode
  if (shouldDelete) {
    if (migratedFiles.length === 0) {
      console.log('\n✅ Nothing to delete!\n')
      process.exit(0)
    }
    
    console.log(`\n⚠️  DELETE MODE ENABLED`)
    console.log(`   This will delete ${migratedFiles.length} files!`)
    console.log(`   Press Ctrl+C within 3 seconds to cancel...\n`)
    
    // Give user time to cancel
    setTimeout(() => {
      let deleted = 0
      let failed = 0
      
      migratedFiles.forEach(file => {
        try {
          fs.unlinkSync(file.path)
          console.log(`   ✅ Deleted: ${file.path}`)
          deleted++
        } catch (err) {
          console.log(`   ❌ Failed: ${file.path} - ${err}`)
          failed++
        }
      })
      
      console.log(`\n📊 Delete Summary:`)
      console.log(`   ✅ Deleted: ${deleted}`)
      console.log(`   ❌ Failed: ${failed}\n`)
      
      process.exit(failed > 0 ? 1 : 0)
    }, 3000)
  } else {
    console.log(`\n💡 To delete migrated files, run:`)
    console.log(`   npx ts-node scripts/find-old-files.ts --delete\n`)
  }
}

main()


