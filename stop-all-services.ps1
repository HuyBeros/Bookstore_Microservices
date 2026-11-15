$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath($PSScriptRoot)
$pidFile = Join-Path $workspace '.cache/services.json'
$services = @()
if (Test-Path -LiteralPath $pidFile) {
    $services = @(Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json)
}
$stopped = $false
foreach ($service in $services) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($service.ProcessId)" -ErrorAction SilentlyContinue
    $ownedJava = $process -and $process.Name -eq 'java.exe' -and $service.Jar -and $process.CommandLine.Contains($service.Jar)
    if ($ownedJava -and $process.CommandLine.Contains($workspace)) {
        Stop-Process -Id $service.ProcessId -Force
        Write-Host "Stopped $($service.Name)"
        $stopped = $true
    }
}

# npm on Windows can launch Vite through node_modules\.bin\..\vite even when
# no frontend PID was recorded. Match the entry point inside this checkout.
$modulesPath = [regex]::Escape((Join-Path $workspace 'bookstore-frontend\node_modules'))
$viteEntry = '(?:^|[\s"])' + $modulesPath + '\\(?:\.bin\\+\.\.\\+)?vite\\bin\\vite\.js(?=[\s"]|$)'
foreach ($process in (Get-CimInstance Win32_Process -Filter "Name = 'node.exe'")) {
    if ($process.CommandLine -and $process.CommandLine.Replace('/', '\') -match $viteEntry) {
        Stop-Process -Id $process.ProcessId -Force
        Write-Host 'Stopped frontend'
        $stopped = $true
    }
}

if (Test-Path -LiteralPath $pidFile) { Remove-Item -LiteralPath $pidFile }
if (-not $stopped) { Write-Host 'No project services found.' }
