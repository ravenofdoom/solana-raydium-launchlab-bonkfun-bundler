# Clean up old wallet sessions
# Keep only the 4 most recent sessions plus any with balances

$walletsDir = "wallets"
Write-Host "Session cleanup analysis:" -ForegroundColor Yellow

# Get all wallet files
$files = Get-ChildItem $walletsDir -Name "*.json" | Sort-Object {
    $timestamp = ($_ -split '_')[-1] -replace '\.json$',''
    if ($timestamp -match '^\d{13}$') { 
        [long]$timestamp 
    } else { 
        0 
    }
} -Descending

Write-Host "`nAll sessions (newest first):" -ForegroundColor Cyan
foreach ($file in $files) {
    $timestamp = ($file -split '_')[-1] -replace '\.json$',''
    $date = if ($timestamp -match '^\d{13}$') { 
        [DateTimeOffset]::FromUnixTimeMilliseconds([long]$timestamp).ToString('yyyy-MM-dd HH:mm:ss')
    } else { 
        'Unknown date' 
    }
    $size = (Get-Item "$walletsDir\$file").Length
    Write-Host "  $file -> $date ($size bytes)"
}

# Keep the 4 most recent
$toKeep = $files | Select-Object -First 4
$toDelete = $files | Select-Object -Skip 4

if ($toDelete.Count -gt 0) {
    Write-Host "`nWould DELETE (keeping 4 most recent):" -ForegroundColor Red
    foreach ($file in $toDelete) {
        $timestamp = ($file -split '_')[-1] -replace '\.json$',''
        $date = if ($timestamp -match '^\d{13}$') { 
            [DateTimeOffset]::FromUnixTimeMilliseconds([long]$timestamp).ToString('yyyy-MM-dd HH:mm:ss')
        } else { 
            'Unknown date' 
        }
        Write-Host "  $file -> $date" -ForegroundColor Red
    }
    
    Write-Host "`nTo actually delete these files, run:" -ForegroundColor Yellow
    Write-Host "Get-ChildItem wallets -Name '*.json' | Sort-Object { `$timestamp = (`$_ -split '_')[-1] -replace '\.json`$',''; if (`$timestamp -match '^\d{13}`$') { [long]`$timestamp } else { 0 } } -Descending | Select-Object -Skip 4 | ForEach-Object { Remove-Item `"wallets\`$_`" -Force; Write-Host `"Deleted `$_`" }"
} else {
    Write-Host "`nNo old sessions to delete (less than 5 total)." -ForegroundColor Green
}

Write-Host "`nWould KEEP:" -ForegroundColor Green
foreach ($file in $toKeep) {
    $timestamp = ($file -split '_')[-1] -replace '\.json$',''
    $date = if ($timestamp -match '^\d{13}$') { 
        [DateTimeOffset]::FromUnixTimeMilliseconds([long]$timestamp).ToString('yyyy-MM-dd HH:mm:ss')
    } else { 
        'Unknown date' 
    }
    Write-Host "  $file -> $date" -ForegroundColor Green
}
