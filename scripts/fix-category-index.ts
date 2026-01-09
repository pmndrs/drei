#!/usr/bin/env ts-node
/**
 * Fix Category Index Files
 * 
 * This script generates proper exports for category index files
 * by scanning the category folder for component subdirectories.
 * 
 * Usage:
 *   npx ts-node scripts/fix-category-index.ts src/core/Cameras
 *   npx ts-node scripts/fix-category-index.ts src/core/Controls
 *   npx ts-node scripts/fix-category-index.ts --all  (fixes all categories)
 */

import fs from 'fs'
import path from 'path'

//* Types ==============================

interface CategoryInfo {
  tier: string
  category: string
  fullPath: string
  components: string[]
}

//* Helper Functions ==============================

function getCategoryInfo(categoryPath: string): CategoryInfo | null {
  const normalized = path.normalize(categoryPath)
  const parts = normalized.split(path.sep)
  
  // Should be something like: src/core/Cameras
  const srcIndex = parts.indexOf('src')
  if (srcIndex === -1) return null
  
  const tier = parts[srcIndex + 1] // core, legacy, webgpu, etc
  const category = parts[srcIndex + 2]
  
  if (!tier || !category) return null
  
  // Get component folders
  if (!fs.existsSync(categoryPath)) {
    console.error(`❌ Path does not exist: ${categoryPath}`)
    return null
  }
  
  const entries = fs.readdirSync(categoryPath, { withFileTypes: true })
  const components = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
  
  return {
    tier,
    category,
    fullPath: categoryPath,
    components
  }
}

function generateIndexContent(info: CategoryInfo): string {
  const { tier, category, components } = info
  
  const header = `//* ${tier.charAt(0).toUpperCase() + tier.slice(1)} ${category} ==============================\n\n`
  
  if (components.length === 0) {
    return header + '// No components yet\nexport {}\n'
  }
  
  const exports = components
    .map(comp => `export * from './${comp}'`)
    .join('\n')
  
  return header + exports + '\n'
}

function fixCategoryIndex(categoryPath: string): boolean {
  const info = getCategoryInfo(categoryPath)
  if (!info) return false
  
  const indexPath = path.join(info.fullPath, 'index.ts')
  const content = generateIndexContent(info)
  
  console.log(`\n📝 Fixing: ${indexPath}`)
  console.log(`   Found ${info.components.length} components:`)
  info.components.forEach(comp => console.log(`   - ${comp}`))
  
  fs.writeFileSync(indexPath, content, 'utf-8')
  console.log(`✅ Updated!`)
  
  return true
}

function getAllCategories(): string[] {
  const categories: string[] = []
  const tiers = ['core', 'external', 'experimental', 'legacy', 'webgpu']
  
  for (const tier of tiers) {
    const tierPath = path.join('src', tier)
    if (!fs.existsSync(tierPath)) continue
    
    const entries = fs.readdirSync(tierPath, { withFileTypes: true })
    const categoryFolders = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .filter(entry => {
        // Only include if it has an index.ts file (category folder)
        const indexPath = path.join(tierPath, entry.name, 'index.ts')
        return fs.existsSync(indexPath)
      })
    
    categoryFolders.forEach(folder => {
      categories.push(path.join(tierPath, folder.name))
    })
  }
  
  return categories
}

//* Main ==============================

function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
Usage:
  Fix specific category:
    npx ts-node scripts/fix-category-index.ts src/core/Cameras

  Fix all categories:
    npx ts-node scripts/fix-category-index.ts --all

  List all categories:
    npx ts-node scripts/fix-category-index.ts --list
`)
    process.exit(1)
  }
  
  // List mode
  if (args[0] === '--list') {
    const categories = getAllCategories()
    console.log(`\n📋 Found ${categories.length} categories:\n`)
    categories.forEach(cat => console.log(`  ${cat}`))
    console.log()
    process.exit(0)
  }
  
  // Fix all mode
  if (args[0] === '--all') {
    const categories = getAllCategories()
    console.log(`\n🔧 Fixing ${categories.length} category indexes...\n`)
    
    let success = 0
    let failed = 0
    
    categories.forEach(cat => {
      if (fixCategoryIndex(cat)) success++
      else failed++
    })
    
    console.log(`\n✅ Success: ${success}`)
    console.log(`❌ Failed: ${failed}`)
    console.log()
    process.exit(failed > 0 ? 1 : 0)
  }
  
  // Fix specific category
  const categoryPath = args[0]
  const success = fixCategoryIndex(categoryPath)
  process.exit(success ? 0 : 1)
}

main()


