# Delete Old Flat Files - V2
# Simpler approach: delete .tsx/.ts files when a matching folder exists

$categories = @(
    'src\core\Staging',
    'src\core\Controls',
    'src\core\Cameras',
    'src\core\Geometry',
    'src\core\Abstractions',
    'src\core\Performance',
    'src\core\Loaders',
    'src\core\Helpers',
    'src\core\Portal',
    'src\core\Effects',
    'src\external\Performance',
    'src\external\Controls',
    'src\external\Geometry',
    'src\external\Helpers',
    'src\external\Loaders',
    'src\experimental\Geometry'
)

$totalDeleted = 0

Write-Host "`n🔍 Deleting old flat files...`n" -ForegroundColor Cyan

foreach ($category in $categories) {
    if (-not (Test-Path $category)) { continue }
    
    $files = Get-ChildItem -Path $category -Include *.tsx,*.ts -File | 
        Where-Object { $_.Name -ne 'index.ts' -and $_.Name -ne 'index.tsx' }
    
    foreach ($file in $files) {
        $basename = $file.BaseName
        $folderPath = Join-Path $category $basename
        
        if (Test-Path $folderPath) {
            $indexPath = Join-Path $folderPath "index.ts"
            if (Test-Path $indexPath) {
                Write-Host "  🗑️  $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Gray
                Remove-Item -Path $file.FullName -Force
                $totalDeleted++
            }
        }
    }
}

# Also clean up old flat files in tier roots
$tierRootFiles = @(
    'src\core\*.tsx',
    'src\core\*.ts',
    'src\external\*.tsx',
    'src\external\*.ts'
)

foreach ($pattern in $tierRootFiles) {
    $files = Get-ChildItem -Path $pattern -File -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.Name -ne 'index.ts' -and 
            $_.Name -ne 'index.tsx' -and
            $_.Name -notlike '*.d.ts'
        }
    
    foreach ($file in $files) {
        $basename = $file.BaseName
        # Check if component exists in any category folder
        $tierPath = $file.Directory.FullName
        $categories = Get-ChildItem -Path $tierPath -Directory
        
        $exists = $false
        foreach ($cat in $categories) {
            $componentPath = Join-Path $cat.FullName $basename
            if ((Test-Path $componentPath) -and (Test-Path (Join-Path $componentPath "index.ts"))) {
                $exists = $true
                break
            }
        }
        
        if ($exists) {
            Write-Host "  🗑️  $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Gray
            Remove-Item -Path $file.FullName -Force
            $totalDeleted++
        }
    }
}

Write-Host "`n✅ Deleted $totalDeleted old flat files`n" -ForegroundColor Green


