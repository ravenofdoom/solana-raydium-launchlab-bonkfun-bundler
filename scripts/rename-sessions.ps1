# Session management helper functions

# Convert old timestamp to new format
function ConvertTo-SessionTimestamp {
    param($oldTimestamp)
    
    if ($oldTimestamp -match '^\d{13}$') {
        $date = [DateTimeOffset]::FromUnixTimeMilliseconds([long]$oldTimestamp)
        return $date.ToString('yyyyMMdd-HHmm')
    }
    return "unknown"
}

# Rename existing sessions to new format
Write-Host "Converting session names to readable format..." -ForegroundColor Yellow

Get-ChildItem wallets -Name "*.json" | ForEach-Object {
    $oldName = $_
    $parts = $oldName -split '_'
    
    if ($parts.Length -ge 2) {
        $sessionBase = ($parts[0..($parts.Length-2)] -join '_')
        $timestamp = $parts[-1] -replace '\.json$',''
        $newTimestamp = ConvertTo-SessionTimestamp $timestamp
        $newName = "${sessionBase}_${newTimestamp}.json"
        
        if ($oldName -ne $newName) {
            Write-Host "Renaming: $oldName -> $newName" -ForegroundColor Green
            Rename-Item "wallets\$oldName" "wallets\$newName"
        }
    }
}

Write-Host "`nUpdated sessions:" -ForegroundColor Cyan
Get-ChildItem wallets -Name "*.json" | Sort-Object
