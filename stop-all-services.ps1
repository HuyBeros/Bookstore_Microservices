$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath($PSScriptRoot)
$pidFile = Join-Path $workspace '.cache/services.json'
if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host 'No recorded backend processes.'; return }
$services = @(Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json)
foreach ($service in $services) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($service.ProcessId)" -ErrorAction SilentlyContinue
    $ownedJava = $process -and $process.Name -eq 'java.exe' -and $service.Jar -and $process.CommandLine.Contains($service.Jar)
    $ownedVite = $process -and $service.Name -eq 'frontend' -and $process.Name -eq 'node.exe' -and $process.CommandLine.Contains('vite')
    if ($process -and $process.CommandLine.Contains($workspace) -and ($ownedJava -or $ownedVite)) {
        Stop-Process -Id $service.ProcessId -Force
        Write-Host "Stopped $($service.Name)"
    }
}
Remove-Item -LiteralPath $pidFile
