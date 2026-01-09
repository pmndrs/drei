# Delete Old Flat Files
# Removes old flat .tsx/.ts files when component exists in CaaF folder

$tiers = @('core', 'external', 'experimental')
$totalDeleted = 0
$whitelist = @('index.ts', 'index.tsx')

Write-Host "`n🔍 Finding old flat files to delete...`n" -ForegroundColor Cyan

foreach ($tier in $tiers) {
    Write-Host "📁 Checking $tier...`n" -ForegroundColor Yellow
    
    # Get all flat files in tier root and immediate subdirectories
    $flatFiles = Get-ChildItem -Path "src\$tier" -Include *.tsx,*.ts -File -Recurse | 
        Where-Object { 
            # Skip files in component folders (those with index.ts)
            $parentHasIndex = Test-Path (Join-Path $_.Directory.FullName "index.ts")
            -not $parentHasIndex -and
            # Skip whitelisted files
            $whitelist -notcontains $_.Name -and
            # Skip .d.ts files
            $_.Name -notlike "*.d.ts"
        }
    
    foreach ($file in $flatFiles) {
        $basename = $file.BaseName
        $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
        
        # Check if this component exists in a CaaF folder
        $parentDir = $file.Directory
        $caafFolder = Get-ChildItem -Path $parentDir -Directory | Where-Object { $_.Name -eq $basename }
        
        if ($caafFolder -and (Test-Path (Join-Path $caafFolder.FullName "index.ts"))) {
            Write-Host "  🗑️  Deleting: $relativePath (exists in $basename/ folder)" -ForegroundColor Gray
            Remove-Item -Path $file.FullName -Force
            $totalDeleted++
        }
    }
}

Write-Host "`n✅ Deleted $totalDeleted old flat files`n" -ForegroundColor Green


