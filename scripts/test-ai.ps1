param([int]$VectorPort = 15433)
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $workspace
$testContainer = $null
try {
    if (Get-NetTCPConnection -State Listen -LocalPort $VectorPort -ErrorAction SilentlyContinue) { throw 'Test port is occupied; existing services will not be stopped.' }
    $testContainer = (& docker run --rm -d --name "bookstore-vector-test-$PID" -p "127.0.0.1:${VectorPort}:5432" -e POSTGRES_DB=ai_vectors_test -e POSTGRES_PASSWORD=vector-test-only pgvector/pgvector:pg17 | Select-Object -Last 1).Trim()
    if ($LASTEXITCODE -ne 0 -or $testContainer -notmatch '^[a-f0-9]{64}$') { throw 'Cannot start isolated pgvector test database.' }
    $ready = $false
    foreach ($attempt in 1..30) {
        & docker exec $testContainer pg_isready -U postgres -d ai_vectors_test *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'Test database did not become ready.' }
    $env:AI_VECTOR_TEST_URL = "jdbc:postgresql://localhost:$VectorPort/ai_vectors_test"
    $env:AI_VECTOR_TEST_PASSWORD = 'vector-test-only'
    & mvn -B -ntp -pl ai-service '-Dmaven.repo.local=.cache/m2' test
    if ($LASTEXITCODE -ne 0) { throw 'AI tests failed.' }
} finally {
    if ($testContainer -match '^[a-f0-9]{64}$') { & docker stop $testContainer | Out-Null }
}
