/**
 * Verify that each entry point's bundle has the correct THREE imports
 * Run after `yarn build` to validate bundle optimization
 *
 * Usage: node scripts/verify-bundles.js
 *
 * Each entry point should have the correct THREE imports based on its platform:
 * - Root/Core/External/Experimental: can have 'three' (renderer-agnostic)
 * - Legacy: only 'three' (no three/webgpu or three/tsl)
 * - WebGPU: only 'three/webgpu' (no plain three)
 * - Native: only 'three/webgpu' (no plain three)
 */
const fs = require('fs')
const path = require('path')

const DREI_DIST = path.join(__dirname, '../dist')

//* Configuration ==============================

const checks = [
  {
    name: 'Root entry (@react-three/drei)',
    file: 'index.mjs',
    // Root can have 'three' imports (renderer-agnostic)
    shouldContain: [],
    shouldNotContain: [],
    notes: 'Root entry is renderer-agnostic, may have plain three imports',
  },
  {
    name: 'Core entry (@react-three/drei/core)',
    file: 'core/core/index.mjs', // obuild nests: core/core/
    // Core is renderer-agnostic
    shouldContain: [],
    shouldNotContain: [],
    notes: 'Core entry is renderer-agnostic',
  },
  {
    name: 'Legacy entry (@react-three/drei/legacy)',
    file: 'legacy/legacy/index.mjs', // obuild nests: legacy/legacy/
    // Legacy should only have 'three', NOT 'three/webgpu' or 'three/tsl'
    shouldContain: [],
    shouldNotContain: ["from 'three/webgpu'", "from 'three/tsl'"],
    notes: 'Legacy entry should only have WebGL (no WebGPU imports)',
  },
  {
    name: 'WebGPU entry (@react-three/drei/webgpu)',
    file: 'webgpu/webgpu/index.mjs', // obuild nests: webgpu/webgpu/
    // WebGPU should have 'three/webgpu' but NOT plain 'three'
    shouldContain: [],
    shouldNotContain: [],
    checkNoPlainThree: true, // Special check: no plain 'three' imports (only three/webgpu)
    notes: 'WebGPU entry should only have three/webgpu imports',
  },
  {
    name: 'Native entry (@react-three/drei/native)',
    file: 'native/native/index.mjs', // obuild nests: native/native/
    // Native (WebGPU-based) should have 'three/webgpu' but NOT plain 'three'
    shouldContain: [],
    shouldNotContain: [],
    checkNoPlainThree: true, // Special check: no plain 'three' imports
    notes: 'Native entry should only have three/webgpu imports (WebGPU-based)',
  },
]

//* Helpers ==============================

function findThreeImports(content) {
  // Match imports from three, three/webgpu, three/tsl, three/addons/*
  const imports = content.match(/from ['"]three[^'"]*['"]/g) || []
  return [...new Set(imports)]
}

function hasPlainThreeImport(imports) {
  // Check if there's a plain 'three' import (not three/webgpu, three/tsl, etc.)
  return imports.some((imp) => imp === "from 'three'" || imp === 'from "three"')
}

function checkForSharedChunks(content) {
  // Check if bundle references external chunks (indicates shared chunking)
  return content.match(/from ['"][^'"]*chunk[^'"]*['"]/gi) || []
}

function getAllJsFiles(dir, files = []) {
  // Recursively get all .js/.mjs files in directory
  if (!fs.existsSync(dir)) return files

  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, files)
    } else if ((item.endsWith('.js') || item.endsWith('.mjs')) && !item.endsWith('.cjs.js')) {
      files.push(fullPath)
    }
  }
  return files
}

function analyzeEntryBundle(entryDir) {
  // Get all JS files for an entry and analyze their imports
  const files = getAllJsFiles(entryDir)
  const allImports = new Set()
  let totalContent = ''

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    totalContent += content
    const imports = findThreeImports(content)
    imports.forEach((imp) => allImports.add(imp))
  }

  return {
    imports: [...allImports],
    content: totalContent,
    fileCount: files.length,
  }
}

//* Analysis ==============================

console.log('\n🔍 Drei Bundle Analysis Report\n')
console.log('='.repeat(60))

let allPassed = true
const results = []

// First check if dist exists
if (!fs.existsSync(DREI_DIST)) {
  console.log('❌ dist folder not found. Run `yarn build` first.\n')
  process.exit(1)
}

for (const check of checks) {
  const entryDir = path.join(DREI_DIST, path.dirname(check.file))
  const indexFile = path.join(DREI_DIST, check.file)

  console.log(`\n📦 ${check.name}`)
  console.log('-'.repeat(60))

  // Check if entry directory exists
  if (!fs.existsSync(entryDir)) {
    console.log(`   ❌ Directory not found: dist/${path.dirname(check.file)}`)
    console.log('   Run `yarn build` first.')
    allPassed = false
    results.push({
      name: check.name,
      passed: false,
      threeImports: [],
      hasPlainThree: false,
      fileCount: 0,
    })
    continue
  }

  // Analyze the entry's bundle
  const analysis = analyzeEntryBundle(entryDir)
  const threeImports = analysis.imports
  const hasPlainThree = hasPlainThreeImport(threeImports)

  console.log(`   📄 Entry: dist/${check.file}`)
  console.log(`   📊 Files analyzed: ${analysis.fileCount}`)

  // Check for required patterns
  let checksPassed = true

  if (check.shouldContain.length > 0) {
    console.log('\n   Required imports:')
    for (const pattern of check.shouldContain) {
      const found = threeImports.some((imp) => imp.includes(pattern.replace(/from |'/g, '')))
      if (found) {
        console.log(`   ✅ Contains: ${pattern}`)
      } else {
        console.log(`   ❌ MISSING: ${pattern}`)
        checksPassed = false
        allPassed = false
      }
    }
  }

  // Check for forbidden patterns
  if (check.shouldNotContain.length > 0) {
    console.log('\n   Forbidden imports:')
    for (const pattern of check.shouldNotContain) {
      const found = threeImports.some((imp) => imp.includes(pattern.replace(/from |'/g, '')))
      if (!found) {
        console.log(`   ✅ Does not contain: ${pattern}`)
      } else {
        console.log(`   ❌ SHOULD NOT contain: ${pattern}`)
        checksPassed = false
        allPassed = false
      }
    }
  }

  // Special check for WebGPU/Native: no plain 'three' imports
  if (check.checkNoPlainThree) {
    console.log('\n   WebGPU isolation check:')
    if (!hasPlainThree) {
      console.log("   ✅ No plain 'three' imports (only three/webgpu)")
    } else {
      console.log("   ❌ Found plain 'three' import (should only use three/webgpu)")
      checksPassed = false
      allPassed = false
    }
  }

  // Show all THREE imports found
  console.log('\n   All THREE imports found:')
  if (threeImports.length > 0) {
    threeImports.forEach((imp) => console.log(`      - ${imp}`))
  } else {
    console.log('      (none - imports may be externalized)')
  }

  // Check for known limitations (warning, not failure)
  if (check.knownLimitation) {
    const hasWebGPU = threeImports.some((imp) => imp.includes('three/webgpu'))
    if (hasWebGPU) {
      console.log(`\n   ⚠️  Known limitation: ${check.knownLimitation}`)
      console.log('   This is expected and does not affect WebGL functionality.')
    }
  }

  if (check.notes) {
    console.log(`\n   📝 ${check.notes}`)
  }

  results.push({
    name: check.name,
    passed: checksPassed,
    threeImports,
    hasPlainThree,
    fileCount: analysis.fileCount,
    knownLimitation: check.knownLimitation,
  })
}

//* Summary ==============================

console.log('\n' + '='.repeat(60))
console.log('📊 Summary')
console.log('='.repeat(60))

results.forEach((r) => {
  let status = r.passed ? '✅' : '❌'
  if (r.passed && r.knownLimitation) status = '⚠️' // Warning for known limitations
  const plainThreeStatus = r.hasPlainThree ? "(has plain 'three')" : "(no plain 'three')"
  console.log(`${status} ${r.name}: ${r.fileCount} files ${plainThreeStatus}`)
})

console.log('\n' + '='.repeat(60))

// Final verdict
if (allPassed) {
  console.log('✅ All checks passed! Bundles are correctly optimized.\n')
  process.exit(0)
} else {
  console.log('❌ Some checks failed. See above for details.\n')
  process.exit(1)
}
