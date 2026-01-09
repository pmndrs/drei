# Fix Utils Imports - Correct Version
# CaaF components (src/tier/Category/Component/file.tsx) need ../../../utils/

$totalFixed = 0

Write-Host "`n🔧 Fixing utils imports (correct paths)...`n" -ForegroundColor Cyan

# Find all component files in CaaF folders
$files = Get-ChildItem -Path "src\core","src\external","src\experimental" -Include *.tsx,*.ts -Recurse -File |
    Where-Object { 
        # Component is in a CaaF folder (has index.ts in same dir)
        $parent = $_.Directory
        (Test-Path (Join-Path $parent.FullName "index.ts")) -and
        $_.Name -ne "index.ts" -and
        $_.Name -notlike "*.test.*"
    }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content
    
    # For CaaF components: src/tier/Category/Component/file.tsx
    # Correct path to utils is: ../../../utils/
    $content = $content -replace "from ['""]\.\./\.\./\.\./\.\./utils/", "from '../../../utils/"
    $content = $content -replace "from ['""]\.\./\.\./\.\./\.\./\.\./utils/", "from '../../../utils/"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✅ $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`n✅ Fixed $totalFixed files`n" -ForegroundColor Green


