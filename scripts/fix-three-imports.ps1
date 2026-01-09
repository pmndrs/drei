# Fix Three.js Imports - Bulk Replace
# Converts 'three' → '#three' in core/external/experimental

$tiers = @('core', 'external', 'experimental')
$totalFixed = 0

Write-Host "`n🔍 Finding files to fix...`n" -ForegroundColor Cyan

foreach ($tier in $tiers) {
    $files = Get-ChildItem -Path "src\$tier" -Filter *.tsx -Recurse -File
    $files += Get-ChildItem -Path "src\$tier" -Filter *.ts -Recurse -File | Where-Object { $_.Name -notlike "*.test.ts" }
    
    Write-Host "📁 $tier`: Found $($files.Count) files" -ForegroundColor Yellow
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        $original = $content
        
        # Replace 'three' imports but NOT 'three-stdlib', 'three-mesh-bvh', 'three/addons', 'three/examples'
        $content = $content -replace "from\s+['""]three['""]", "from '#three'"
        
        if ($content -ne $original) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "  ✅ $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Green
            $totalFixed++
        }
    }
}

Write-Host "`n✅ Fixed $totalFixed files`n" -ForegroundColor Green


