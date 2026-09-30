function Remove-BOM {
    param($path)
    if (Test-Path $path) {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            $text = $utf8NoBom.GetString($bytes, 3, $bytes.Length - 3)
            [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
            Write-Host "Removed BOM from $path"
        }
    }
}
Remove-BOM "backend/src/inventory/inventory.controller.ts"
Remove-BOM "backend/src/inventory/inventory.service.ts"
Remove-BOM "frontend/src/app/inventory/products/page.tsx"
Remove-BOM "frontend/src/components/app-sidebar.tsx"
