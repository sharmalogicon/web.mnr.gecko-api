# Runs the numbered Repair scripts against the LOCAL SQL Server, in order, and logs each run to RUN_LOG.md.
# Without -From, it skips files already logged as "LOCAL ... OK". Stops at the first failure.
#   .\run_local.ps1            .\run_local.ps1 -From 5 -To 7            .\run_local.ps1 -WhatIf
param(
    [string]$Server = 'localhost',
    [int]$From = 0,
    [int]$To = 999,
    [switch]$WhatIf
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$log  = Join-Path $here 'RUN_LOG.md'
$done = @()
if ((Test-Path $log) -and $From -eq 0) {
    $done = Get-Content $log -Encoding UTF8 | Where-Object { $_ -match '\| LOCAL .*\| OK \|' } |
            ForEach-Object { ($_ -split '\|')[3].Trim() }
}
$files = Get-ChildItem $here -Filter '*.sql' | Where-Object { $_.Name -match '^\d{3}_' } | Sort-Object Name
foreach ($f in $files) {
    $no = [int]$f.Name.Substring(0, 3)
    if ($no -lt $From -or $no -gt $To) { continue }
    if ($done -contains $f.Name) { Write-Host "skip (already OK locally)  $($f.Name)"; continue }
    $db = ((Select-String -Path $f.FullName -Pattern ':setvar TARGETDB "(.+)"' | Select-Object -First 1).Matches[0].Groups[1].Value)
    Write-Host "== $($f.Name)  ->  $db" -ForegroundColor Cyan
    if ($WhatIf) { continue }
    & sqlcmd -S $Server -E -d $db -b -I -i $f.FullName   # -I: QUOTED_IDENTIFIER ON, as SSMS and the app use
    $rc = $LASTEXITCODE
    $result = if ($rc -eq 0) { 'OK' } else { "FAILED (exit $rc)" }
    Add-Content -Path $log -Encoding UTF8 -Value ("| {0} | LOCAL ({1}) | {2} | {3} |" -f (Get-Date -Format 'yyyy-MM-dd HH:mm'), $Server, $f.Name, $result)
    if ($rc -ne 0) { Write-Host "STOPPED: $($f.Name) failed. Nothing after it was run." -ForegroundColor Red; exit $rc }
}
Write-Host 'Done.' -ForegroundColor Green
