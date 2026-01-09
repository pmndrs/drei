# Fix Utils Imports
# Components in CaaF folders need correct path to src/utils

$totalFixed = 0

Write-Host "`n🔧 Fixing utils imports...`n" -ForegroundColor Cyan

# Find all component files
$files = Get-ChildItem -Path "src\core","src\external","src\experimental" -Include *.tsx,*.ts -Recurse -File |
    Where-Object { 
        $_.Name -notlike "*.test.*" -and
        $_.Name -ne "index.ts"
    }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content
    
    # Count how many levels deep this file is from src/
    $relativePath = $file.FullName.Replace((Get-Location).Path + '\src\', '')
    $depth = ($relativePath.Split('\') | Measure-Object).Count - 1
    
    # Build correct path to utils (should be ../../../utils for most CaaF components)
    $correctPath = '../' * ($depth + 1) + 'utils'
    
    # Replace incorrect utils paths
    $content = $content -replace "from ['""]\.\./\.\./utils/", "from '$correctPath/"
    $content = $content -replace "from ['""]\.\./utils/", "from '$correctPath/"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✅ $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`n✅ Fixed $totalFixed files`n" -ForegroundColor Green


