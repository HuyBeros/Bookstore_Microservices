param(
    [switch]$SkipBuild,
    [switch]$SkipInfrastructure,
    [switch]$SkipFrontend,
    [int]$TimeoutSeconds = 120
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$workspace = $PSScriptRoot
New-Item -ItemType Directory -Force -Path (Join-Path $workspace 'logs'), (Join-Path $workspace '.cache') | Out-Null

if (-not (Test-Path -LiteralPath '.env')) { throw 'Copy .env.example to .env and configure DB_PASSWORD, JWT_SECRET and ADMIN_PASSWORD.' }
# Treat .env as data; never evaluate its contents as a command.
Get-Content -LiteralPath '.env' | ForEach-Object {
    if ($_ -match '^\s*([A-Z][A-Z0-9_]*)\s*=(.*)$') {
        $key = $matches[1]
        $value = $matches[2].Trim().Trim('"').Trim("'")
        if ($key -match '^(DB_|JWT_|ADMIN_|EUREKA_|CATALOG_|INVENTORY_|AI_|GEMINI_|REDIS_|CORS_|SWAGGER_|SPRING_PROFILES_ACTIVE$|PGADMIN_)') {
            if (-not [Environment]::GetEnvironmentVariable($key, 'Process')) { [Environment]::SetEnvironmentVariable($key, $value, 'Process') }
        }
    }
}
foreach ($key in @('DB_PASSWORD', 'JWT_SECRET', 'ADMIN_PASSWORD')) {
    if (-not [Environment]::GetEnvironmentVariable($key, 'Process')) { throw "Missing required setting: $key" }
}
try { $jwtBytes = [Convert]::FromBase64String($env:JWT_SECRET) } catch { throw 'JWT_SECRET must be Base64.' }
if ($jwtBytes.Length -lt 32) { throw 'JWT_SECRET must contain at least 32 random bytes.' }
if (-not $env:JWT_ISSUER) { $env:JWT_ISSUER = 'http://localhost:8081' }

function Wait-Ready([string]$Name, [string]$Url, $Process, [int]$Expected = 200) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ($Process -and $Process.HasExited) { throw "$Name exited. Check logs/$Name.log and logs/$Name-err.log." }
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq $Expected) { Write-Host "$Name ready" -ForegroundColor Green; return }
        } catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq $Expected) { Write-Host "$Name ready" -ForegroundColor Green; return } }
        Start-Sleep -Seconds 2
    }
    throw "$Name not ready after $TimeoutSeconds seconds. Check logs and Eureka registration."
}
if (-not $SkipInfrastructure) {
    docker compose up -d --wait postgres redis
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL/Redis startup failed. Start Docker Desktop or use -SkipInfrastructure for your existing databases.' }
}
if (-not $SkipBuild) {
    mvn -B -ntp -DskipTests package
    if ($LASTEXITCODE -ne 0) { throw 'Backend build failed; no services were started.' }
}
$services = @(
    @{ Name = 'eureka-server'; Port = 8761; Health = 'http://localhost:8761/eureka/apps' },
    @{ Name = 'user-services'; Port = 8081 },
    @{ Name = 'catalog-service'; Port = 8082 },
    @{ Name = 'inventory-service'; Port = 8084 },
    @{ Name = 'order-service'; Port = 8083 },
    @{ Name = 'ai-service'; Port = 8085 },
    @{ Name = 'api-gateway'; Port = 8080 }
)
# Resolve the actual JVM executable rather than a PATH shim, so recorded PIDs own the service.
$savedErrorPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    $javaHomeLine = (& java -XshowSettings:properties -version 2>&1 | ForEach-Object { $_.ToString() } | Where-Object { $_ -match '^\s*java.home\s*=' } | Select-Object -First 1)
} finally { $ErrorActionPreference = $savedErrorPreference }
if (-not $javaHomeLine) { throw 'Cannot resolve the Java runtime directory.' }
$javaRuntimeDirectory = ($javaHomeLine -split '=', 2)[1].Trim()
$javaExecutable = Join-Path $javaRuntimeDirectory 'bin/java.exe'
if (-not (Test-Path -LiteralPath $javaExecutable)) { throw 'Cannot locate the actual java.exe.' }

$started = @()
$pidFile = Join-Path $workspace '.cache/services.json'
$recorded = @()
if (Test-Path -LiteralPath $pidFile) { $recorded = @(Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json) }
foreach ($service in $services) {
    $serviceName = $service.Name
    $health = if ($service.Health) { $service.Health } else { "http://localhost:$($service.Port)/actuator/health" }
    $existing = Get-NetTCPConnection -State Listen -LocalPort $service.Port -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Port $($service.Port) is occupied; checking existing $serviceName."
        Wait-Ready $serviceName $health $null
        continue
    }
    $jar = Join-Path $workspace "$serviceName/target/$serviceName-0.0.1-SNAPSHOT.jar"
    if (-not (Test-Path -LiteralPath $jar)) { throw "Missing $jar. Run without -SkipBuild." }
    $process = Start-Process -FilePath $javaExecutable -ArgumentList @('-jar', ('"' + $jar + '"')) -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -RedirectStandardOutput "logs/$serviceName.log" -RedirectStandardError "logs/$serviceName-err.log"
    $started += [pscustomobject]@{ Name = $serviceName; ProcessId = $process.Id; Jar = $jar }
    @($recorded + $started) | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $pidFile -Encoding UTF8
    Wait-Ready $serviceName $health $process
}
# Wait for actual gateway routing after discovery has propagated.
Wait-Ready 'gateway-catalog-route' 'http://localhost:8080/api/catalog/books?page=0&size=1' $null
Wait-Ready 'gateway-inventory-route' 'http://localhost:8080/api/inventory/availability?ids=1' $null
Wait-Ready 'gateway-order-route' 'http://localhost:8080/api/cart' $null 401
Wait-Ready 'gateway-ai-route' 'http://localhost:8080/api/ai/chat' $null 401
if (-not $SkipFrontend) {
    if (-not (Test-Path -LiteralPath 'bookstore-frontend/node_modules')) { throw 'Run npm ci inside bookstore-frontend, then start again.' }
    if (-not (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue)) {
        Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1') -WorkingDirectory (Join-Path $workspace 'bookstore-frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $workspace 'logs/frontend.log') -RedirectStandardError (Join-Path $workspace 'logs/frontend-err.log') | Out-Null
    }
    Wait-Ready 'frontend' 'http://localhost:5173' $null
    $listener = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
        $vite = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
        if ($vite -and $vite.Name -eq 'node.exe' -and $vite.CommandLine.Contains($workspace) -and $vite.CommandLine.Contains('vite')) {
            $started += [pscustomobject]@{ Name = 'frontend'; ProcessId = $vite.ProcessId; Jar = '' }
            @($recorded + $started) | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $pidFile -Encoding UTF8
        }
    }
}
Write-Host 'Backend ready: http://localhost:8080 | Frontend: http://localhost:5173' -ForegroundColor Green
