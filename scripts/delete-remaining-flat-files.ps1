# Delete remaining flat files in category folders
# These are files like src/core/Staging/Float.tsx when Float/ folder exists

$totalDeleted = 0

Write-Host "`n🔍 Deleting remaining flat files in category folders...`n" -ForegroundColor Cyan

# Get all category folders that contain component folders
$categoryPaths = Get-ChildItem -Path "src\core","src\external","src\experimental" -Directory -Recurse |
    Where-Object { 
        # This is a category if it contains folders with index.ts
        $subfolders = Get-ChildItem -Path $_.FullName -Directory
        $hasComponents = $subfolders | Where-Object { Test-Path (Join-Path $_.FullName "index.ts") }
        $hasComponents.Count -gt 0
    }

foreach ($category in $categoryPaths) {
    $flatFiles = Get-ChildItem -Path $category.FullName -Include *.tsx,*.ts -File |
        Where-Object { $_.Name -ne 'index.ts' -and $_.Name -ne 'index.tsx' -and $_.Name -notlike '*.d.ts' }
    
    foreach ($file in $flatFiles) {
        $basename = $file.BaseName
        $folderPath = Join-Path $category.FullName $basename
        
        # Check if matching CaaF folder exists
        if ((Test-Path $folderPath) -and (Test-Path (Join-Path $folderPath "index.ts"))) {
            Write-Host "  🗑️  $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Gray
            Remove-Item -Path $file.FullName -Force
            $totalDeleted++
        }
    }
}

Write-Host "`n✅ Deleted $totalDeleted additional flat files`n" -ForegroundColor Green


