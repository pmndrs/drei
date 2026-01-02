#!/usr/bin/env ts-node

//* Simple Component Migration Helper ==============================
// Use this as a reference for manual migration steps

import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper function to show where a component should go
 */
export function classifyComponent(name: string, rootSource: string, supportLevel: string): {
  tier: 'core' | 'external' | 'experimental' | 'legacy' | 'webgpu';
  needsSplit: boolean;
} {
  // Platform-specific components (need both legacy and webgpu)
  const platformSpecific = [
    'Fbo', 'useFBO', 'useDepthBuffer', 'RenderTexture', 'RenderCubeTexture',
    'CubeCamera', 'Effects', 'MeshDistortMaterial', 'MeshReflectorMaterial',
    'MeshTransmissionMaterial', 'MeshRefractionMaterial', 'MeshWobbleMaterial',
    'MeshPortalMaterial', 'Outlines', 'Image', 'Caustics', 'ContactShadows',
    'AccumulativeShadows', 'SoftShadows', 'BakeShadows', 'PointMaterial',
    'BlurPass', 'ConvolutionMaterial', 'DiscardMaterial', 'SpotLightMaterial',
    'WireframeMaterial', 'MultiMaterial', 'MeshDiscardMaterial', 'shaderMaterial'
  ];

  const needsSplit = platformSpecific.some(comp =>
    name.toLowerCase().includes(comp.toLowerCase())
  );

  if (needsSplit) {
    return { tier: 'legacy', needsSplit: true };
  } else if (rootSource === 'External') {
    return { tier: 'external', needsSplit: false };
  } else if (supportLevel === 'Experimental') {
    return { tier: 'experimental', needsSplit: false };
  } else {
    return { tier: 'core', needsSplit: false };
  }
}

/**
 * Helper to update imports
 */
export function updateImports(content: string, targetTier: string): string {
  if (targetTier === 'core' || targetTier === 'external' || targetTier === 'experimental') {
    // Replace 'three' → '#three'
    content = content.replace(
      /import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g,
      "import * as THREE from '#three'"
    );
    content = content.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]three['"]/g,
      "import {$1} from '#three'"
    );
  } else if (targetTier === 'webgpu') {
    // Replace 'three' → 'three/webgpu'
    content = content.replace(
      /import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g,
      "import * as THREE from 'three/webgpu'"
    );
    content = content.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]three['"]/g,
      "import {$1} from 'three/webgpu'"
    );
  }
  // 'legacy' keeps 'three' as-is

  return content;
}

/**
 * Show migration instructions for a component
 */
export function showMigrationInstructions(
  componentName: string,
  currentPath: string,
  category: string,
  tier: string,
  needsSplit: boolean
): void {
  console.log(`\n📦 ${componentName}`);
  console.log(`Current: ${currentPath}`);
  console.log(`Category: ${category}`);
  console.log(`Tier: ${tier}`);
  console.log(`Needs Split: ${needsSplit ? 'Yes' : 'No'}`);
  
  console.log(`\n📋 Steps:`);
  
  if (needsSplit) {
    console.log(`1. Create: src/legacy/${category}/${componentName}/`);
    console.log(`2. Copy file to: src/legacy/${category}/${componentName}/${componentName}.tsx`);
    console.log(`3. Keep imports as 'three' (WebGL)`);
    console.log(`4. Create: src/webgpu/${category}/${componentName}/`);
    console.log(`5. Copy file to: src/webgpu/${category}/${componentName}/${componentName}.tsx`);
    console.log(`6. Update imports to 'three/webgpu'`);
    console.log(`7. Add TODO comment for TSL conversion`);
    console.log(`8. Create index.ts in both folders: export * from './${componentName}'`);
    console.log(`9. Update src/legacy/${category}/index.ts`);
    console.log(`10. Update src/webgpu/${category}/index.ts`);
  } else {
    console.log(`1. Create: src/${tier}/${category}/${componentName}/`);
    console.log(`2. Move file to: src/${tier}/${category}/${componentName}/${componentName}.tsx`);
    console.log(`3. Update imports: 'three' → '#three'`);
    console.log(`4. Create index.ts: export * from './${componentName}'`);
    console.log(`5. Update src/${tier}/${category}/index.ts`);
  }
  
  console.log(`\n✅ Test component works after migration`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: ts-node migrate-component.ts <ComponentName> <Category> <RootSource> [SupportLevel]');
    console.log('\nExample:');
    console.log('  ts-node migrate-component.ts OrbitControls Controls Drei Standard');
    console.log('  ts-node migrate-component.ts MeshDistortMaterial Materials Drei Standard');
    process.exit(1);
  }
  
  const [componentName, category, rootSource, supportLevel = 'Standard'] = args;
  const classification = classifyComponent(componentName, rootSource, supportLevel);
  
  // Try to find current file
  const possiblePaths = [
    `src/core/${componentName}.tsx`,
    `src/core/${componentName}.ts`,
    `src/gl/materials/${componentName}.tsx`,
    `src/external/${componentName}.tsx`,
  ];
  
  const currentPath = possiblePaths.find(p => fs.existsSync(p)) || 'Not found';
  
  showMigrationInstructions(
    componentName,
    currentPath,
    category,
    classification.tier,
    classification.needsSplit
  );
}


