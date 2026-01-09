# Batch Component Migration Script
# Phase 1: Just move files, don't worry if they work yet

$components = @(
    # Format: @{Source="path"; Dest="tier/Category/ComponentName"; Name="ComponentName"}
    
    # Loaders
    @{Source="src/core/loaders/Progress.tsx"; Dest="src/core/Loaders/useProgress"; Name="useProgress"},
    @{Source="src/core/loaders/Ktx2.tsx"; Dest="src/core/Loaders/useKTX2"; Name="useKTX2"},
    @{Source="src/core/loaders/Gltf.tsx"; Dest="src/core/Loaders/useGLTF"; Name="useGLTF"},
    @{Source="src/core/loaders/Fbx.tsx"; Dest="src/core/Loaders/useFBX"; Name="useFBX"},
    @{Source="src/core/Texture.tsx"; Dest="src/core/Loaders/useTexture"; Name="useTexture"},
    @{Source="src/core/VideoTexture.tsx"; Dest="src/core/Loaders/VideoTexture"; Name="VideoTexture"},
    @{Source="src/core/CubeTexture.tsx"; Dest="src/core/Loaders/CubeTexture"; Name="CubeTexture"},
    @{Source="src/gl/materials/MatcapTexture.tsx"; Dest="src/core/Loaders/MatcapTexture"; Name="MatcapTexture"},
    @{Source="src/core/useFont.tsx"; Dest="src/core/Loaders/useFont"; Name="useFont"},
    @{Source="src/core/useSpriteLoader.tsx"; Dest="src/core/Loaders/useSpriteLoader"; Name="useSpriteLoader"},
    @{Source="src/core/TrailTexture.tsx"; Dest="src/core/Loaders/TrailTexture"; Name="TrailTexture"},
    @{Source="src/web/Loader.tsx"; Dest="src/core/Loaders/Loader"; Name="Loader"},
    @{Source="src/core/loaders/Preload.tsx"; Dest="src/core/Loaders/Preload"; Name="Preload"},
    @{Source="src/web/ScreenVideoTexture.tsx"; Dest="src/core/Loaders/ScreenVideoTexture"; Name="ScreenVideoTexture"},
    @{Source="src/web/WebcamVideoTexture.tsx"; Dest="src/core/Loaders/WebcamVideoTexture"; Name="WebcamVideoTexture"},
    
    # Helpers
    @{Source="src/web/Html.tsx"; Dest="src/core/Helpers/Html"; Name="Html"},
    @{Source="src/core/Text.tsx"; Dest="src/core/Helpers/Text"; Name="Text"},
    @{Source="src/core/PositionalAudio.tsx"; Dest="src/core/Helpers/PositionalAudio"; Name="PositionalAudio"},
    @{Source="src/web/useCursor.tsx"; Dest="src/core/Helpers/useCursor"; Name="useCursor"},
    @{Source="src/core/Helper.tsx"; Dest="src/core/Helpers/useHelper"; Name="useHelper"},
    @{Source="src/core/useAnimations.tsx"; Dest="src/core/Helpers/useAnimations"; Name="useAnimations"},
    @{Source="src/core/useAspect.tsx"; Dest="src/core/Helpers/useAspect"; Name="useAspect"},
    @{Source="src/core/SpriteAnimator.tsx"; Dest="src/core/Helpers/SpriteAnimator"; Name="SpriteAnimator"},
    @{Source="src/core/useContextBridge.tsx"; Dest="src/core/Helpers/useContextBridge"; Name="useContextBridge"},
    @{Source="src/core/useIntersect.tsx"; Dest="src/core/Helpers/useIntersect"; Name="useIntersect"},
    @{Source="src/web/CycleRaycast.tsx"; Dest="src/core/Helpers/CycleRaycast"; Name="CycleRaycast"},
    @{Source="src/core/PointMaterial.tsx"; Dest="src/core/Helpers/PointMaterial"; Name="PointMaterial"},
    
    # Portal
    @{Source="src/core/portals/View.tsx"; Dest="src/core/Portal/View"; Name="View"},
    @{Source="src/core/portals/Mask.tsx"; Dest="src/core/Portal/Mask"; Name="Mask"},
    @{Source="src/core/portals/Fisheye.tsx"; Dest="src/core/Portal/Fisheye"; Name="Fisheye"},
    
    # Effects
    @{Source="src/core/effects/Sparkles.tsx"; Dest="src/core/Effects/Sparkles"; Name="Sparkles"},
    @{Source="src/core/effects/Cloud.tsx"; Dest="src/core/Effects/Cloud"; Name="Cloud"},
    @{Source="src/core/effects/CameraShake.tsx"; Dest="src/core/Effects/CameraShake"; Name="CameraShake"},
    
    # External
    @{Source="src/external/Bvh.tsx"; Dest="src/external/Performance/Bvh"; Name="Bvh"},
    @{Source="src/external/CameraControls.tsx"; Dest="src/external/Controls/CameraControls"; Name="CameraControls"},
    @{Source="src/external/Facemesh.tsx"; Dest="src/external/Geometry/Facemesh"; Name="Facemesh"},
    @{Source="src/external/Splat.tsx"; Dest="src/external/Geometry/Splat"; Name="Splat"},
    @{Source="src/external/FaceLandmarker.tsx"; Dest="src/external/Helpers/FaceLandmarker"; Name="FaceLandmarker"},
    @{Source="src/external/NormalTexture.tsx"; Dest="src/external/Loaders/NormalTexture"; Name="NormalTexture"},
    
    # Experimental
    @{Source="src/core/demos/MarchingCubes.tsx"; Dest="src/experimental/Geometry/MarchingCubes"; Name="MarchingCubes"}
)

$moved = 0
$errors = 0

foreach ($comp in $components) {
    $source = $comp.Source
    $dest = $comp.Dest
    $name = $comp.Name
    
    Write-Host "`n[$moved / $($components.Count)] Processing: $name" -ForegroundColor Cyan
    
    if (-not (Test-Path $source)) {
        Write-Host "  ⚠️  Source not found: $source" -ForegroundColor Yellow
        $errors++
        continue
    }
    
    # Create destination folder
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    
    # Copy file
    $destFile = Join-Path $dest "$name.tsx"
    if (Test-Path $source) {
        Copy-Item $source -Destination $destFile -Force
        Write-Host "  ✓ Copied to: $destFile" -ForegroundColor Green
    }
    
    # Create index.ts
    $indexContent = "export * from './$name'`n"
    Set-Content -Path (Join-Path $dest "index.ts") -Value $indexContent
    Write-Host "  ✓ Created index.ts" -ForegroundColor Green
    
    # Create placeholder test
    $testContent = @"
import { describe, it } from 'vitest'

describe('$name', () => {
  it('TODO: Add tests after Phase 2', () => {
    // Placeholder test - will implement after migration complete
  })
})
"@
    Set-Content -Path (Join-Path $dest "$name.test.ts") -Value $testContent
    Write-Host "  ✓ Created placeholder test" -ForegroundColor Green
    
    $moved++
}

Write-Host "`n" -NoNewline
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Moved: $moved components" -ForegroundColor Green
Write-Host "Errors: $errors components" -ForegroundColor $(if($errors -gt 0){"Yellow"}else{"Green"})

