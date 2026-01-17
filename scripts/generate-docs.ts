#!/usr/bin/env ts-node

//* TSDoc to MDX Documentation Generator ==============================
// Extracts TSDoc from component files and generates MDX for pmndrs/docs
// Simple components are fully auto-generated; complex ones use .docs.mdx templates

import * as fs from 'fs'
import * as path from 'path'
import * as chokidar from 'chokidar'
import { parse as parseComment } from 'comment-parser'
import reactDocgen from 'react-docgen-typescript'
const { withCompilerOptions } = reactDocgen
import { docCategories, tiers, paths, badges, componentOverrides, toKebabCase, getDocFileName } from './docs-config.js'
import type { InjectionTag } from './docs-config.js'

//* TSDoc Extraction ==============================

// Configure react-docgen-typescript parser
const docgenParser = withCompilerOptions(
  { esModuleInterop: true, jsx: 2 /* React */ },
  {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop: any) => {
      // Filter out inherited HTML/React props unless explicitly documented
      if (prop.declarations && prop.declarations.length > 0) {
        const isFromNodeModules = prop.declarations.some((d: any) => d.fileName.includes('node_modules'))
        if (isFromNodeModules) return false
      }
      return true
    },
  }
)

/**
 * Extract JSDoc tags from a file's source code
 */
function extractJSDocTags(
  filePath: string,
  componentName: string
): {
  description: string
  examples: { title: string; code: string }[]
  see: string[]
  remarks: string[]
} {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Find the JSDoc comment immediately before the component export
  // Must be a multi-line JSDoc (starts with /** and has newlines) to avoid matching prop comments
  // The comment should be followed directly by export const/function ComponentName

  // Pattern: multi-line JSDoc followed by export const ComponentName
  // The (?=...) ensures we match the JSDoc RIGHT BEFORE the export
  const exportPattern = new RegExp(`(\\/\\*\\*\\s*\\n[\\s\\S]*?\\*\\/)\\s*\\nexport\\s+const\\s+${componentName}`, 'm')

  let jsdocComment = ''
  const match = content.match(exportPattern)

  if (match) {
    jsdocComment = match[1]
  } else {
    // Fallback: try to find any multi-line JSDoc before export function
    const funcPattern = new RegExp(
      `(\\/\\*\\*\\s*\\n[\\s\\S]*?\\*\\/)\\s*\\nexport\\s+function\\s+${componentName}`,
      'm'
    )
    const funcMatch = content.match(funcPattern)
    if (funcMatch) {
      jsdocComment = funcMatch[1]
    }
  }

  if (!jsdocComment) {
    console.log(`     ⚠ No JSDoc found for ${componentName}`)
    return { description: '', examples: [], see: [], remarks: [] }
  }

  // Use comment-parser for description and simple tags
  const parsed = parseComment(jsdocComment)
  if (parsed.length === 0) {
    return { description: '', examples: [], see: [], remarks: [] }
  }

  const block = parsed[0]
  const description = block.description || ''
  const see: string[] = []
  const remarks: string[] = []

  for (const tag of block.tags) {
    switch (tag.tag) {
      case 'see':
        see.push(tag.description || tag.name)
        break
      case 'remarks':
        remarks.push(tag.description)
        break
    }
  }

  // Extract @example tags directly from raw source to preserve formatting
  // Strip the leading ` * ` from each line first
  const cleanedJsDoc = jsdocComment
    .replace(/^\/\*\*\s*\n?/, '') // Remove opening /**
    .replace(/\s*\*\/$/, '') // Remove closing */
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '')) // Remove leading * from each line
    .join('\n')

  const examples: { title: string; code: string }[] = []

  // Find all @example blocks
  const examplePattern = /@example\s+([^\n]*)\n```(?:jsx?|tsx?)?\s*\n([\s\S]*?)```/g
  let exampleMatch

  while ((exampleMatch = examplePattern.exec(cleanedJsDoc)) !== null) {
    const title = exampleMatch[1].trim()
    const code = exampleMatch[2].trim()
    if (code) {
      examples.push({ title, code })
    }
  }

  return { description, examples, see, remarks }
}

/**
 * Extract documentation from a component file using react-docgen-typescript + comment-parser
 */
function extractTSDoc(filePath: string, category: string): ExtractedDoc | null {
  try {
    const docs = docgenParser.parse(filePath)

    if (docs.length === 0) {
      console.log(`  ⚠ No component found in ${path.basename(filePath)}`)
      return null
    }

    // Use the first exported component (usually the main one)
    const component = docs[0]
    const componentName = component.displayName

    // Extract JSDoc tags (examples, see, remarks) that react-docgen doesn't capture
    const jsdocTags = extractJSDocTags(filePath, componentName)

    // Merge description from both sources (react-docgen often has better description)
    const description = component.description || jsdocTags.description

    // Process props
    const props: PropInfo[] = Object.entries(component.props || {}).map(([name, prop]) => ({
      name,
      type: prop.type?.name || 'unknown',
      required: prop.required,
      defaultValue: prop.defaultValue?.value ?? null,
      description: prop.description || '',
    }))

    // Generate story path from file path
    const relativePath = path.relative(paths.src, filePath)
    const parts = relativePath.replace(/\.tsx$/, '').split(path.sep)
    const storyPath = parts.join('-').toLowerCase().replace(/\//g, '-')

    return {
      name: componentName,
      description,
      examples: jsdocTags.examples,
      props,
      see: jsdocTags.see,
      remarks: jsdocTags.remarks,
      sourcePath: path.relative(path.dirname(paths.src), filePath).replace(/\\/g, '/'),
      category,
      storyPath,
    }
  } catch (error) {
    console.error(`  ✗ Error extracting docs from ${filePath}:`, error)
    return null
  }
}

//* MDX Generation ==============================

/**
 * Generate the frontmatter section
 */
function generateFrontmatter(doc: ExtractedDoc): string {
  return `---
title: ${doc.name}
sourcecode: ${doc.sourcePath}
---`
}

/**
 * Generate badges section
 */
function generateBadges(doc: ExtractedDoc): string {
  const override = componentOverrides[doc.name]
  const badgeList: string[] = []

  // Storybook badge
  const storyPath = override?.storyPath || `${doc.category}-${doc.name.toLowerCase()}--${doc.name.toLowerCase()}-st`
  badgeList.push(badges.storybook(storyPath))

  // Suspense badge
  if (override?.suspense) {
    badgeList.push(badges.suspense)
  }

  // DOM-only badge
  if (override?.domOnly) {
    badgeList.push(badges.domOnly)
  }

  return badgeList.join(' ')
}

/**
 * Generate description section
 */
function generateDescription(doc: ExtractedDoc): string {
  return doc.description || ''
}

/**
 * Generate examples section
 */
function generateExamples(doc: ExtractedDoc): string {
  if (doc.examples.length === 0) return ''

  return doc.examples
    .map((ex) => {
      const title = ex.title ? `### ${ex.title}\n\n` : ''
      return `${title}\`\`\`jsx
${ex.code}
\`\`\``
    })
    .join('\n\n')
}

/**
 * Generate props table
 */
function generatePropsTable(doc: ExtractedDoc): string {
  if (doc.props.length === 0) return ''

  const rows = doc.props.map((prop) => {
    const defaultVal = prop.defaultValue ? `\`${prop.defaultValue}\`` : '-'
    const type = prop.type.replace(/\|/g, '\\|') // Escape pipe chars for markdown
    return `| ${prop.name} | \`${type}\` | ${defaultVal} | ${prop.description} |`
  })

  return `## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
${rows.join('\n')}`
}

/**
 * Generate content for a specific injection tag
 */
function generateTagContent(tag: InjectionTag, doc: ExtractedDoc): string {
  switch (tag) {
    case 'AUTO:badges':
      return generateBadges(doc)
    case 'AUTO:description':
      return generateDescription(doc)
    case 'AUTO:example':
      return generateExamples(doc)
    case 'AUTO:props':
      return generatePropsTable(doc)
    case 'AUTO:all':
      return [generateBadges(doc), '', generateDescription(doc), '', generateExamples(doc)].filter(Boolean).join('\n\n')
    default:
      return ''
  }
}

/**
 * Generate complete MDX when no template exists
 */
function generateFullMDX(doc: ExtractedDoc): string {
  const sections = [
    generateFrontmatter(doc),
    '',
    generateBadges(doc),
    '',
    generateDescription(doc),
    '',
    generateExamples(doc),
  ]

  return sections.filter((s) => s !== undefined).join('\n')
}

/**
 * Process a .docs.mdx template and replace injection tags
 */
function processTemplate(templatePath: string, doc: ExtractedDoc): string {
  let content = fs.readFileSync(templatePath, 'utf-8')

  // Replace injection tags
  const tagPattern = /\{\/\*\s*(AUTO:[a-z]+)\s*\*\/\}/gi

  content = content.replace(tagPattern, (match, tag: string) => {
    const normalizedTag = tag as InjectionTag
    return generateTagContent(normalizedTag, doc)
  })

  // If template doesn't have frontmatter, add it
  if (!content.startsWith('---')) {
    content = generateFrontmatter(doc) + '\n\n' + content
  }

  return content
}

//* File Discovery ==============================

/**
 * Find all component files and their associated docs templates
 */
function discoverComponents(): ProcessedComponent[] {
  const components: ProcessedComponent[] = []

  for (const tier of tiers) {
    const tierPath = path.join(paths.src, tier)
    if (!fs.existsSync(tierPath)) continue

    // Walk through category folders
    const categories = fs
      .readdirSync(tierPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

    for (const category of categories) {
      const categoryPath = path.join(tierPath, category)
      const docCategory = docCategories[category]

      if (!docCategory) {
        // Skip categories not mapped to docs
        continue
      }

      // Walk through component folders within category
      const componentFolders = fs
        .readdirSync(categoryPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)

      for (const componentFolder of componentFolders) {
        const componentPath = path.join(categoryPath, componentFolder)

        // Find main component file (same name as folder)
        const componentFile = `${componentFolder}.tsx`
        const componentFilePath = path.join(componentPath, componentFile)

        if (!fs.existsSync(componentFilePath)) continue

        // Check for docs template
        const docsTemplatePath = path.join(componentPath, `${componentFolder}.docs.mdx`)
        const hasTemplate = fs.existsSync(docsTemplatePath)

        // Determine output path using kebab-case naming
        const outputFileName = getDocFileName(componentFolder)
        const outputPath = path.join(paths.docs, docCategory, outputFileName)

        components.push({
          filePath: componentFilePath,
          docsTemplatePath: hasTemplate ? docsTemplatePath : null,
          outputPath,
          extracted: null, // Will be populated during processing
        })
      }
    }
  }

  return components
}

//* Main ==============================

/**
 * Backup the docs folder to docs-original before generation
 * This preserves hand-written docs for comparison
 */
function backupDocs(): void {
  const originalPath = paths.docs + '-original'

  if (fs.existsSync(originalPath)) {
    console.log('📦 Backup already exists at docs-original/\n')
    return
  }

  if (!fs.existsSync(paths.docs)) {
    console.log('📦 No docs folder to backup\n')
    return
  }

  console.log('📦 Backing up docs/ to docs-original/...')

  // Recursively copy docs to docs-original
  const copyRecursive = (src: string, dest: string) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  copyRecursive(paths.docs, originalPath)
  console.log('   ✓ Backup complete\n')
}

async function main() {
  const args = process.argv.slice(2)
  const watchMode = args.includes('--watch')
  const singleComponent = args.find((a) => !a.startsWith('--'))
  const skipBackup = args.includes('--no-backup')

  console.log('📚 TSDoc to MDX Documentation Generator\n')

  // Backup existing docs before generation (unless --no-backup flag)
  if (!skipBackup) {
    backupDocs()
  }

  // Discover components
  console.log('🔍 Discovering components...')
  let components = discoverComponents()

  // Filter to single component if specified
  if (singleComponent) {
    components = components.filter((c) => c.filePath.toLowerCase().includes(singleComponent.toLowerCase()))
  }

  console.log(`   Found ${components.length} components\n`)

  // Process each component
  let generated = 0
  let skipped = 0
  let errors = 0

  for (const component of components) {
    const componentName = path.basename(component.filePath, '.tsx')
    const relativePath = path.relative(paths.src, component.filePath)

    console.log(`📄 ${relativePath}`)

    // Extract TSDoc
    const category = path.basename(path.dirname(path.dirname(component.filePath)))
    const docCategory = docCategories[category] || 'misc'
    const extracted = extractTSDoc(component.filePath, docCategory)

    if (!extracted) {
      skipped++
      continue
    }

    // Generate or process template
    let mdxContent: string

    if (component.docsTemplatePath) {
      console.log(`   📝 Using template: ${path.basename(component.docsTemplatePath)}`)
      mdxContent = processTemplate(component.docsTemplatePath, extracted)
    } else {
      mdxContent = generateFullMDX(extracted)
    }

    // Ensure output directory exists
    const outputDir = path.dirname(component.outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Write output
    fs.writeFileSync(component.outputPath, mdxContent)
    console.log(`   ✓ Generated: ${path.relative(paths.docs, component.outputPath)}`)
    generated++
  }

  // Summary
  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Generated: ${generated}`)
  console.log(`⏭  Skipped: ${skipped}`)
  if (errors > 0) console.log(`❌ Errors: ${errors}`)

  const originalPath = paths.docs + '-original'
  if (fs.existsSync(originalPath)) {
    console.log(`\n📁 Original docs preserved in: docs-original/`)
    console.log(`   Compare with: diff -r docs-original docs`)
  }

  // Watch mode
  if (watchMode) {
    console.log('\n👀 Watching for changes... (Ctrl+C to stop)')
    console.log(`   Watching: ${paths.src}`)
    console.log('   File types: *.tsx, *.docs.mdx\n')

    startWatcher(components)
  }
}

//* Watch Mode ==============================

/**
 * Start file watcher for live documentation regeneration
 */
function startWatcher(initialComponents: ProcessedComponent[]): void {
  // Build a map for quick component lookup by file path
  const componentMap = new Map<string, ProcessedComponent>()

  for (const component of initialComponents) {
    // Map both the component file and its docs template
    componentMap.set(normalizePath(component.filePath), component)
    if (component.docsTemplatePath) {
      componentMap.set(normalizePath(component.docsTemplatePath), component)
    }
  }

  // Watch patterns - component files and docs templates
  const watchPatterns = [path.join(paths.src, '**/*.tsx'), path.join(paths.src, '**/*.docs.mdx')]

  const watcher = chokidar.watch(watchPatterns, {
    ignored: [
      /(^|[\/\\])\../, // Dotfiles
      /\.stories\.tsx$/, // Story files
      /node_modules/,
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  })

  // Handle file changes
  watcher.on('change', (filePath) => {
    handleFileChange(filePath, componentMap)
  })

  // Handle new files (might be a new component or docs template)
  watcher.on('add', (filePath) => {
    // Re-discover components to catch new ones
    const newComponents = discoverComponents()

    // Update the map
    componentMap.clear()
    for (const component of newComponents) {
      componentMap.set(normalizePath(component.filePath), component)
      if (component.docsTemplatePath) {
        componentMap.set(normalizePath(component.docsTemplatePath), component)
      }
    }

    handleFileChange(filePath, componentMap)
  })

  watcher.on('error', (error) => {
    console.error(`\n❌ Watcher error: ${error}`)
  })
}

/**
 * Normalize file path for consistent comparison
 */
function normalizePath(filePath: string): string {
  return path.normalize(filePath).toLowerCase()
}

/**
 * Handle a single file change - regenerate its documentation
 */
function handleFileChange(filePath: string, componentMap: Map<string, ProcessedComponent>): void {
  const normalizedPath = normalizePath(filePath)
  const relativePath = path.relative(paths.src, filePath)

  // Check if this file is part of a known component
  let component = componentMap.get(normalizedPath)

  // If not found directly, try to find by component folder
  if (!component) {
    const componentFolder = path.basename(path.dirname(filePath))
    const componentFile = `${componentFolder}.tsx`

    // Look for a matching component
    for (const [, comp] of componentMap) {
      if (path.basename(comp.filePath) === componentFile) {
        component = comp
        break
      }
    }
  }

  if (!component) {
    console.log(`\n⏭  Skipped: ${relativePath} (not a tracked component)`)
    return
  }

  const componentName = path.basename(component.filePath, '.tsx')
  console.log(`\n🔄 Changed: ${relativePath}`)

  // Re-extract and regenerate
  const category = path.basename(path.dirname(path.dirname(component.filePath)))
  const docCategory = docCategories[category] || 'misc'
  const extracted = extractTSDoc(component.filePath, docCategory)

  if (!extracted) {
    console.log(`   ⚠ Could not extract docs for ${componentName}`)
    return
  }

  // Generate or process template
  let mdxContent: string

  if (component.docsTemplatePath && fs.existsSync(component.docsTemplatePath)) {
    console.log(`   📝 Using template: ${path.basename(component.docsTemplatePath)}`)
    mdxContent = processTemplate(component.docsTemplatePath, extracted)
  } else {
    mdxContent = generateFullMDX(extracted)
  }

  // Ensure output directory exists
  const outputDir = path.dirname(component.outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write output
  fs.writeFileSync(component.outputPath, mdxContent)
  console.log(`   ✅ Updated: ${path.relative(paths.docs, component.outputPath)}`)
}

// Run (ESM equivalent of require.main === module)
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main().catch(console.error)
}

export { extractTSDoc, generateFullMDX, processTemplate, discoverComponents }
