# Fix Relative Imports
# Components moved into subfolders need one more level: ../utils → ../../utils

$totalFixed = 0

Write-Host "`n🔧 Fixing relative imports...`n" -ForegroundColor Cyan

# Find all component files in CaaF folders (not flat files)
$files = Get-ChildItem -Path "src\core","src\external","src\experimental" -Include *.tsx,*.ts -Recurse -File |
    Where-Object { 
        # Component is in a subfolder with index.ts (CaaF pattern)
        $parent = $_.Directory
        (Test-Path (Join-Path $parent.FullName "index.ts")) -and
        $_.Name -ne "index.ts" -and
        $_.Name -notlike "*.test.*"
    }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content
    
    # Fix common relative import patterns
    # ../utils → ../../utils
    $content = $content -replace "from ['""]\.\./utils/", "from '../../utils/"
    # ../core → ../../core (less common but possible)
    $content = $content -replace "from ['""]\.\./core/", "from '../../core/"
    # ../Fbo → ../Helpers/Fbo (cross-component imports)
    # We'll handle these case by case as they error
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✅ $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`n✅ Fixed $totalFixed files`n" -ForegroundColor Green


