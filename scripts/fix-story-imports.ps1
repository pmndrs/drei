# fix-story-imports.ps1
# Fixes imports in migrated story files
# - Changes '../Setup' to '@storybook-setup'
# - Changes '../../src' to 'drei'

$StoryFiles = Get-ChildItem -Path ".\src" -Recurse -Filter "*.stories.tsx"

$fixedCount = 0

foreach ($file in $StoryFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Fix Setup import (both single and double quotes)
    $content = $content -replace "from '../Setup'", "from '@storybook-setup'"
    $content = $content -replace 'from "../Setup"', "from '@storybook-setup'"
    
    # Fix ../../src import (both single and double quotes)
    $content = $content -replace "from '../../src'", "from 'drei'"
    $content = $content -replace 'from "../../src"', "from 'drei'"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Fixed: $($file.FullName -replace [regex]::Escape((Get-Location).Path + '\'), '')" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "`n========== DONE ==========" -ForegroundColor Cyan
Write-Host "Fixed $fixedCount files" -ForegroundColor Green
