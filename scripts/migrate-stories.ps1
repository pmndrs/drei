# migrate-stories.ps1
# Moves stories from .storybook/stories to co-locate with their components
# Usage: 
#   .\scripts\migrate-stories.ps1           # Dry run (preview only)
#   .\scripts\migrate-stories.ps1 -Execute  # Actually move files

param(
    [switch]$Execute
)

$StoriesDir = ".\.storybook\stories"
$SearchDirs = @(".\src\core", ".\src\legacy", ".\src\external")

# Track results
$moved = @()
$notFound = @()
$special = @()

if (-not $Execute) {
    Write-Host "`n🔍 DRY RUN MODE - No files will be moved" -ForegroundColor Cyan
    Write-Host "   Run with -Execute to actually move files`n" -ForegroundColor DarkGray
}

Get-ChildItem -Path $StoriesDir -Filter "*.stories.tsx" | ForEach-Object {
    $storyFile = $_
    $storyName = $_.BaseName -replace '\.stories$', ''  # e.g., "DetectGPU"
    
    # Handle Shapes.* pattern specially
    if ($storyName -match '^Shapes\.') {
        $special += $storyFile.Name
        Write-Host "⚠️  SPECIAL: $($storyFile.Name) - Shapes are in single file" -ForegroundColor Yellow
        return
    }
    
    # Search for ComponentName.tsx in all source directories
    $found = $false
    foreach ($searchDir in $SearchDirs) {
        # Look for ComponentName/ComponentName.tsx pattern
        $componentPath = Get-ChildItem -Path $searchDir -Recurse -Filter "$storyName.tsx" -ErrorAction SilentlyContinue |
            Where-Object { $_.Directory.Name -eq $storyName } |
            Select-Object -First 1
        
        if ($componentPath) {
            $targetDir = $componentPath.Directory.FullName
            $targetStoryPath = Join-Path $targetDir "$storyName.stories.tsx"
            $testFilePath = Join-Path $targetDir "$storyName.test.ts"
            
            # Build relative path for display
            $relativePath = $targetDir -replace [regex]::Escape((Get-Location).Path + "\"), ""
            
            Write-Host "✅ $($storyFile.Name)" -ForegroundColor Green
            Write-Host "   → $relativePath" -ForegroundColor DarkGray
            
            if ($Execute) {
                # Move story file
                Copy-Item -Path $storyFile.FullName -Destination $targetStoryPath -Force
                Remove-Item -Path $storyFile.FullName -Force
                
                # Delete test file if it exists
                if (Test-Path $testFilePath) {
                    Remove-Item -Path $testFilePath -Force
                    Write-Host "   🗑️  Deleted $storyName.test.ts" -ForegroundColor DarkGray
                }
            } else {
                # Dry run - just show what would happen
                if (Test-Path $testFilePath) {
                    Write-Host "   🗑️  Would delete $storyName.test.ts" -ForegroundColor DarkGray
                }
            }
            
            $moved += @{
                Story = $storyFile.Name
                Destination = $relativePath
            }
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        $notFound += $storyFile.Name
        Write-Host "❌ NOT FOUND: $($storyFile.Name)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n========== SUMMARY ==========" -ForegroundColor Cyan
if ($Execute) {
    Write-Host "Moved: $($moved.Count)" -ForegroundColor Green
} else {
    Write-Host "Would Move: $($moved.Count)" -ForegroundColor Green
}
Write-Host "Not Found: $($notFound.Count)" -ForegroundColor Red
Write-Host "Special Cases: $($special.Count)" -ForegroundColor Yellow

if ($notFound.Count -gt 0) {
    Write-Host "`nNot Found (no matching component):" -ForegroundColor Red
    $notFound | ForEach-Object { Write-Host "  - $_" }
}

if ($special.Count -gt 0) {
    Write-Host "`nSpecial Cases (need manual handling):" -ForegroundColor Yellow
    $special | ForEach-Object { Write-Host "  - $_" }
}

if (-not $Execute) {
    Write-Host "`n💡 Run with -Execute to actually move files" -ForegroundColor Cyan
}

