#!/usr/bin/env ts-node
/**
 * Fix Three.js Imports - Bulk Replace
 * Converts 'three' → '#three' in core/external/experimental
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const TIERS = ['core', 'external', 'experimental'];

async function fixImports() {
  console.log('🔍 Finding files to fix...\n');
  
  let totalFixed = 0;
  
  for (const tier of TIERS) {
    const pattern = `src/${tier}/**/*.{ts,tsx}`;
    const files = await glob(pattern, { ignore: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'] });
    
    console.log(`📁 ${tier}: Found ${files.length} files`);
    
    for (const file of files) {
      let content = fs.readFileSync(file, 'utf-8');
      const original = content;
      
      // Replace all variations of 'three' imports
      // But NOT 'three-stdlib', 'three-mesh-bvh', 'three/addons', 'three/examples'
      content = content.replace(/from\s+['"]three['"]/g, `from '#three'`);
      
      if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`  ✅ ${file}`);
        totalFixed++;
      }
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} files`);
}

fixImports().catch(console.error);


