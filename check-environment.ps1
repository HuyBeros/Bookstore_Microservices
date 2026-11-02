# Script kiem tra moi truong cho BookStore Microservices
# Chay: powershell -ExecutionPolicy Bypass -File .\check-environment.ps1

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   CHECK ENVIRONMENT - BOOKSTORE MICROSERVICES      " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Docker
Write-Host "1. Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "   [OK] Docker: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "   [X] Docker not installed or not running" -ForegroundColor Red
        Write-Host "      Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "   [X] Docker not installed" -ForegroundColor Red
    $allGood = $false
}

# Check Java
Write-Host "2. Checking Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    if ($javaVersion) {
        Write-Host "   [OK] Java: $javaVersion" -ForegroundColor Green
        
        # Check version >= 17
        $versionMatch = $javaVersion -match '"(\d+)'
        if ($matches[1] -lt 17) {
            Write-Host "   [!] Warning: Need Java 17 or higher" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [X] Java not installed" -ForegroundColor Red
        Write-Host "      Download: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "   [X] Java not installed" -ForegroundColor Red
    $allGood = $false
}

# Check Maven (optional)
Write-Host "3. Checking Maven..." -ForegroundColor Yellow
try {
    $mavenVersion = mvn --version 2>$null | Select-String "Apache Maven"
    if ($mavenVersion) {
        Write-Host "   [OK] Maven: $mavenVersion" -ForegroundColor Green
    } else {
        Write-Host "   [!] Maven not found (optional - Maven Wrapper available)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [!] Maven not found (optional - Maven Wrapper available)" -ForegroundColor Yellow
}

# Check Node.js
Write-Host "4. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "   [OK] Node.js: $nodeVersion" -ForegroundColor Green
        
        # Check npm
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Host "   [OK] npm: $npmVersion" -ForegroundColor Green
        }
    } else {
        Write-Host "   [X] Node.js not installed (required for frontend)" -ForegroundColor Red
        Write-Host "      Download: https://nodejs.org/" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "   [X] Node.js not installed" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan

# Check .env file
Write-Host "5. Checking configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   [OK] .env file exists" -ForegroundColor Green
} else {
    Write-Host "   [!] .env file not found, will use .env.example" -ForegroundColor Yellow
}

# Check Docker daemon
Write-Host "6. Checking Docker daemon..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>$null
    if ($dockerInfo) {
        Write-Host "   [OK] Docker daemon is running" -ForegroundColor Green
    } else {
        Write-Host "   [X] Docker daemon not running - start Docker Desktop" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [X] Docker daemon not running" -ForegroundColor Red
    $allGood = $false
}

# Check important ports
Write-Host "7. Checking important ports..." -ForegroundColor Yellow
$ports = @{
    "5432" = "PostgreSQL"
    "6379" = "Redis"
    "5050" = "pgAdmin"
    "8761" = "Eureka Server"
    "8080" = "API Gateway"
    "8081" = "User Service"
    "8082" = "Catalog Service"
    "8083" = "Order Service"
    "8084" = "Inventory Service"
    "8085" = "AI Service"
}

$portsInUse = @()
foreach ($port in $ports.Keys) {
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        Write-Host "   [!] Port $port ($($ports[$port])) is in use" -ForegroundColor Yellow
    }
}

if ($portsInUse.Count -eq 0) {
    Write-Host "   [OK] All required ports are available" -ForegroundColor Green
} else {
    Write-Host "   [i] Some ports are in use (services may be already running)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "                  CHECK RESULT                      " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host ""
    Write-Host "[OK] ENVIRONMENT IS READY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start Docker: docker compose up -d" -ForegroundColor White
    Write-Host "2. Run services: .\run-services.ps1 (select option 4)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[X] NEED TO INSTALL SOME TOOLS" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install the missing tools above." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "See detailed guide: HUONG_DAN_SETUP.md" -ForegroundColor Cyan
Write-Host ""
