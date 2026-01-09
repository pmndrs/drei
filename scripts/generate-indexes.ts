#!/usr/bin/env ts-node

//* Index File Generation Script ==============================

import * as fs from 'fs';
import * as path from 'path';

const categories = {
  core: ['Cameras', 'Controls', 'Staging', 'Geometry', 'Abstractions', 'Performance', 'Loaders', 'Helpers', 'Portal', 'Effects', 'Lights'],
  external: ['Performance', 'Controls', 'Geometry', 'Helpers', 'Loaders'],
  experimental: ['Geometry', 'Helpers'],
  legacy: ['Helpers', 'Portal', 'Cameras', 'Abstractions', 'Materials'],
  webgpu: ['Helpers', 'Portal', 'Cameras', 'Abstractions', 'Materials'],
};

function generateCategoryIndex(tier: string, category: string): void {
  const dir = path.join('src', tier, category);
  const indexPath = path.join(dir, 'index.ts');

  const content = `//* ${tier.charAt(0).toUpperCase() + tier.slice(1)} ${category} ==============================

// TODO: Add component exports after migration
export {}
`;

  fs.writeFileSync(indexPath, content);
  console.log(`✓ Created: ${indexPath}`);
}

function generateTierIndex(tier: string, cats: string[]): void {
  const indexPath = path.join('src', tier, 'index.ts');

  let content = `//* ${tier.charAt(0).toUpperCase() + tier.slice(1)} Entry Point ==============================\n\n`;

  for (const category of cats) {
    content += `export * from './${category}'\n`;
  }

  fs.writeFileSync(indexPath, content);
  console.log(`✓ Created: ${indexPath}`);
}

function generateRootIndex(): void {
  const indexPath = path.join('src', 'index.ts');

  const content = `//* Root Entry Point ==============================
// Includes: core + external + experimental (renderer-agnostic only)

export * from './core'
export * from './external'
export * from './experimental'

// Note: legacy and webgpu are NOT included in root
// Import them explicitly: '@react-three/drei/legacy' or '@react-three/drei/webgpu'
`;

  fs.writeFileSync(indexPath, content);
  console.log(`✓ Created: ${indexPath}`);
}

function main() {
  console.log('🔨 Generating index files...\n');

  // Generate category-level indexes
  for (const [tier, cats] of Object.entries(categories)) {
    console.log(`\n📁 ${tier}/`);
    for (const category of cats) {
      generateCategoryIndex(tier, category);
    }
  }

  // Generate tier-level indexes
  console.log('\n📦 Tier indexes:');
  for (const [tier, cats] of Object.entries(categories)) {
    generateTierIndex(tier, cats);
  }

  // Generate root index
  console.log('\n🌍 Root index:');
  generateRootIndex();

  console.log('\n✅ All index files generated!');
}

if (require.main === module) {
  main();
}


