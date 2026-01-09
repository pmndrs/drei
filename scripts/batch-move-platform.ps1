# Batch Platform-Specific Component Migration
# These components get copied to BOTH legacy/ and webgpu/ folders

$components = @(
    # Helpers (Render Targets)
    @{Source="src/core/Fbo.tsx"; Category="Helpers"; Name="Fbo"},
    
    # Portal (Render Targets)
    @{Source="src/core/RenderTexture.tsx"; Category="Portal"; Name="RenderTexture"},
    @{Source="src/core/RenderCubeTexture.tsx"; Category="Portal"; Name="RenderCubeTexture"},
    @{Source="src/core/portals/Hud.tsx"; Category="Portal"; Name="Hud"},
    
    # Cameras (Render Targets)
    @{Source="src/core/CubeCamera.tsx"; Category="Cameras"; Name="CubeCamera"},
    
    # Abstractions
    @{Source="src/gl/Effects.tsx"; Category="Abstractions"; Name="Effects"},
    
    # Materials (need GLSL → TSL conversion for WebGPU)
    @{Source="src/gl/materials/MeshDistortMaterial.tsx"; Category="Materials"; Name="MeshDistortMaterial"},
    @{Source="src/gl/materials/MeshReflectorMaterial.tsx"; Category="Materials"; Name="MeshReflectorMaterial"},
    @{Source="src/gl/materials/MeshTransmissionMaterial.tsx"; Category="Materials"; Name="MeshTransmissionMaterial"},
    @{Source="src/gl/materials/MeshRefractionMaterial.tsx"; Category="Materials"; Name="MeshRefractionMaterial"},
    @{Source="src/gl/materials/MeshWobbleMaterial.tsx"; Category="Materials"; Name="MeshWobbleMaterial"},
    @{Source="src/gl/materials/MeshPortalMaterial.tsx"; Category="Materials"; Name="MeshPortalMaterial"},
    @{Source="src/gl/Outlines.tsx"; Category="Materials"; Name="Outlines"},
    @{Source="src/core/Image.tsx"; Category="Materials"; Name="Image"},
    @{Source="src/gl/Caustics.tsx"; Category="Materials"; Name="Caustics"},
    @{Source="src/core/staging/ContactShadows.tsx"; Category="Materials"; Name="ContactShadows"},
    @{Source="src/core/staging/AccumulativeShadows.tsx"; Category="Materials"; Name="AccumulativeShadows"},
    @{Source="src/core/softShadows.tsx"; Category="Materials"; Name="SoftShadows"},
    @{Source="src/core/BakeShadows.tsx"; Category="Materials"; Name="BakeShadows"},
    @{Source="src/core/materials/GradientTexture.tsx"; Category="Materials"; Name="GradientTexture"},
    @{Source="src/gl/materials/BlurPass.tsx"; Category="Materials"; Name="BlurPass"},
    @{Source="src/gl/materials/ConvolutionMaterial.tsx"; Category="Materials"; Name="ConvolutionMaterial"},
    @{Source="src/gl/materials/DiscardMaterial.tsx"; Category="Materials"; Name="DiscardMaterial"},
    @{Source="src/gl/materials/SpotLightMaterial.tsx"; Category="Materials"; Name="SpotLightMaterial"},
    @{Source="src/gl/materials/WireframeMaterial.tsx"; Category="Materials"; Name="WireframeMaterial"},
    @{Source="src/gl/materials/MeshDiscardMaterial.tsx"; Category="Materials"; Name="MeshDiscardMaterial"},
    @{Source="src/gl/materials/shaderMaterial.tsx"; Category="Materials"; Name="shaderMaterial"}
)

$moved = 0
$errors = 0

foreach ($comp in $components) {
    $source = $comp.Source
    $category = $comp.Category
    $name = $comp.Name
    
    Write-Host "`n[$moved / $($components.Count)] Processing: $name" -ForegroundColor Cyan
    
    if (-not (Test-Path $source)) {
        Write-Host "  ⚠️  Source not found: $source" -ForegroundColor Yellow
        $errors++
        continue
    }
    
    # Copy to LEGACY folder
    $legacyPath = "src/legacy/$category/$name"
    New-Item -ItemType Directory -Force -Path $legacyPath | Out-Null
    Copy-Item $source -Destination "$legacyPath/$name.tsx" -Force
    Set-Content -Path "$legacyPath/index.ts" -Value "export * from './$name'`n"
    $testContent = @"
import { describe, it } from 'vitest'

describe('$name (Legacy/WebGL)', () => {
  it('TODO: Add tests after Phase 2', () => {
    // Placeholder test - will implement after migration complete
  })
})
"@
    Set-Content -Path "$legacyPath/$name.test.ts" -Value $testContent
    Write-Host "  ✓ Copied to legacy/$category/$name" -ForegroundColor Green
    
    # Copy to WEBGPU folder
    $webgpuPath = "src/webgpu/$category/$name"
    New-Item -ItemType Directory -Force -Path $webgpuPath | Out-Null
    Copy-Item $source -Destination "$webgpuPath/$name.tsx" -Force
    Set-Content -Path "$webgpuPath/index.ts" -Value "export * from './$name'`n"
    $webgpuTestContent = @"
import { describe, it } from 'vitest'

describe('$name (WebGPU)', () => {
  it('TODO: Add tests after Phase 2', () => {
    // Placeholder test - will implement after migration complete
    // NOTE: Needs TSL conversion for shaders
  })
})
"@
    Set-Content -Path "$webgpuPath/$name.test.ts" -Value $webgpuTestContent
    Write-Host "  ✓ Copied to webgpu/$category/$name" -ForegroundColor Green
    
    # Add TODO comment to WebGPU version if it's a material
    if ($category -eq "Materials") {
        $content = Get-Content "$webgpuPath/$name.tsx" -Raw
        $todoComment = "//* TODO: Convert GLSL shaders to TSL for WebGPU ==============================`n`n"
        Set-Content -Path "$webgpuPath/$name.tsx" -Value ($todoComment + $content)
        Write-Host "  ⚠️  Added TSL conversion TODO to WebGPU version" -ForegroundColor Yellow
    }
    
    $moved++
}

Write-Host "`n" -NoNewline
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Platform-Specific Migration Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Moved: $moved components to BOTH legacy/ and webgpu/" -ForegroundColor Green
Write-Host "Errors: $errors components" -ForegroundColor $(if($errors -gt 0){"Yellow"}else{"Green"})


