param([ValidateRange(1,65535)][int]$RedisPort = 16379)
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $workspace
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

$processes = @()
$results = @()
$redisContainerId = $null
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$env:JWT_ISSUER = 'http://localhost:18081'
$env:JWT_AUDIENCE = 'bookstore'
$env:ADMIN_USERNAME = 'http-integration-admin'
$env:ADMIN_PASSWORD = 'HttpTest@' + [Guid]::NewGuid().ToString('N')
$env:ADMIN_EMAIL = 'http-admin@example.test'
$env:DB_PASSWORD = 'test-only'
$env:EUREKA_URL = 'http://127.0.0.1:18761/eureka/'
$env:EUREKA_ENABLED = 'true'
$env:CATALOG_URL = 'http://localhost:18082'
$env:INVENTORY_URL = 'http://localhost:18084'
$env:INVENTORY_MOCK = 'false'
$env:AI_RAG_ENABLED = 'false'
$env:SPRING_PROFILES_ACTIVE = 'http-integration'
$h2Repository = Join-Path $workspace '.cache/m2/com/h2database/h2'
if (-not (Test-Path -LiteralPath $h2Repository)) { throw 'Run mvn with -Dmaven.repo.local=.cache/m2 test package first.' }
$h2 = (Get-ChildItem -LiteralPath $h2Repository -Recurse -Filter 'h2-*.jar' | Sort-Object FullName -Descending | Select-Object -First 1).FullName
function Call([string]$Method, [string]$Path, $Body = $null, [string]$Token = '') {
    $headers = @{}
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $args = @{ Uri = "http://localhost:18080$Path"; Method = $Method; Headers = $headers; TimeoutSec = 30; UseBasicParsing = $true }
    if ($null -ne $Body) { $args.ContentType = 'application/json'; $args.Body = ConvertTo-Json -InputObject $Body -Depth 10 -Compress }
    $response = Invoke-WebRequest @args
    if (-not $response.Content) { return $null }
    $data = $response.Content | ConvertFrom-Json
    if ($data.PSObject.Properties.Name -contains 'success' -and $data.PSObject.Properties.Name -contains 'data') { return $data.data }
    return $data
}
function Check([string]$Name, [bool]$Condition) {
    if (-not $Condition) { throw "FAILED: $Name" }
    $script:results += $Name
    Write-Output "PASS: $Name"
}
function Check-Status([string]$Name, [string]$Method, [string]$Path, [string]$Token, [int]$Expected, $Body = $null) {
    $status = 200
    try { Call $Method $Path $Body $Token | Out-Null }
    catch {
        if (-not $_.Exception.Response) { throw }
        $status = [int]$_.Exception.Response.StatusCode
    }
    Check $Name ($status -eq $Expected)
}
function Wait-Http([string]$Name, [string]$Url, $Process, [int]$Expected = 200) {
    $deadline = (Get-Date).AddSeconds(100)
    do {
        if ($Process -and $Process.HasExited) { throw "$Name exited; inspect logs/http-$Name.log" }
        try { $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq $Expected) { return } } catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq $Expected) { return } }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    throw "$Name not ready"
}
try {
    if (Get-NetTCPConnection -State Listen -LocalPort $RedisPort -ErrorAction SilentlyContinue) {
        throw "Test Redis port $RedisPort is occupied; the existing Redis will not be used or stopped."
    }
    $containerOutput = & docker run --rm -d --name "bookstore-http-redis-$PID" -p "127.0.0.1:${RedisPort}:6379" redis:7-alpine
    if ($LASTEXITCODE -ne 0) { throw 'Cannot start isolated test Redis; start Docker Desktop first.' }
    $redisContainerId = ($containerOutput | Select-Object -Last 1).Trim()
    if ($redisContainerId -notmatch '^[a-f0-9]{64}$') { throw 'Unexpected Docker container ID.' }
    $redisDeadline = (Get-Date).AddSeconds(20)
    do {
        $redisPong = & docker exec $redisContainerId redis-cli ping 2>$null
        if ($LASTEXITCODE -eq 0 -and $redisPong -eq 'PONG') { break }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $redisDeadline)
    if ($redisPong -ne 'PONG') { throw 'Isolated Redis is not ready.' }
    foreach ($spec in @(@('eureka-server',18761), @('user-services',18081), @('catalog-service',18082), @('inventory-service',18084), @('order-service',18083), @('ai-service',18085), @('api-gateway',18080))) {
        $name = $spec[0]; $port = $spec[1]
        if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Test port $port is occupied; nothing on this port will be stopped." }
        $jar = Join-Path $workspace "$name/target/$name-0.0.1-SNAPSHOT.jar"
        $args = @(("-Dloader.path=" + $h2), '-cp', ('"' + $jar + '"'), 'org.springframework.boot.loader.launch.PropertiesLauncher', "--server.port=$port", '--eureka.instance.prefer-ip-address=true', '--eureka.instance.ip-address=127.0.0.1')
        # Eureka Server otherwise defaults its peer URL to localhost:8761 even
        # when register-with-eureka=false, leaking test registrations to dev.
        $args += @('--eureka.instance.hostname=127.0.0.1', "--eureka.client.service-url.defaultZone=$($env:EUREKA_URL)")
        if ($name -ne 'eureka-server') {
            $args += @('--spring.data.redis.host=127.0.0.1', "--spring.data.redis.port=$RedisPort", '--spring.data.redis.password=', '--spring.data.redis.connect-timeout=1s', '--spring.data.redis.timeout=1s')
        }
        if ($name -notin @('eureka-server','api-gateway')) {
            $args += @("--spring.datasource.url=jdbc:h2:mem:http_$($name.Replace('-','_'));MODE=PostgreSQL;DB_CLOSE_DELAY=-1", '--spring.datasource.username=sa', '--spring.datasource.password=', '--spring.datasource.driver-class-name=org.h2.Driver', '--spring.jpa.database-platform=org.hibernate.dialect.H2Dialect', '--management.health.redis.enabled=false', '--ai.gemini.api-key=', '--ai.gemini.model=')
        }
        $process = Start-Process -FilePath $javaExecutable -ArgumentList $args -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -RedirectStandardOutput "logs/http-$name.log" -RedirectStandardError "logs/http-$name-err.log"
        $processes += $process
        $url = if ($name -eq 'eureka-server') { "http://localhost:$port/eureka/apps" } else { "http://localhost:$port/actuator/health" }
        Wait-Http $name $url $process
        Write-Output "READY: $name"
    }
    Wait-Http 'gateway-discovery' 'http://localhost:18080/api/catalog/books?page=0&size=1' $null
    Wait-Http 'gateway-inventory-discovery' 'http://localhost:18080/api/inventory/availability?ids=1' $null
    Wait-Http 'gateway-order-discovery' 'http://localhost:18080/api/cart' $null 401
    Wait-Http 'gateway-ai-discovery' 'http://localhost:18080/api/ai/chat' $null 401
    [xml]$testRegistry = (Invoke-WebRequest -Uri 'http://127.0.0.1:18761/eureka/apps' -Headers @{Accept='application/xml'} -TimeoutSec 5).Content
    $testInstances = @($testRegistry.applications.application | ForEach-Object { $_.instance })
    $foreignInstances = @($testInstances | Where-Object { [int]$_.port.'#text' -notin @(18080,18081,18082,18083,18084,18085) })
    Check 'Eureka registry contains only isolated test instances' ($testInstances.Count -eq 6 -and $foreignInstances.Count -eq 0)
    $admin = Call POST '/api/auth/login' @{ usernameOrEmail = $env:ADMIN_USERNAME; password = $env:ADMIN_PASSWORD }
    Check 'Login through gateway' ([bool]$admin.accessToken)
    $adminToken = $admin.accessToken
    $customer = Call POST '/api/auth/register' @{ username='httpcustomer'; password='HttpCustomer@123456'; fullName='HTTP customer'; email='http-customer@example.test' }
    $customerToken = $customer.accessToken
    Check 'Customer registration' ([bool]$customerToken)
    $category = Call POST '/api/catalog/categories' @{ name='HTTP category' } $adminToken
    $author = Call POST '/api/catalog/authors' @{ name='HTTP author' } $adminToken
    $publisher = Call POST '/api/catalog/publishers' @{ name='HTTP publisher' } $adminToken
    $book = Call POST '/api/catalog/books' @{ title='HTTP integration Java'; price=100000; categoryId=$category.id; publisherId=$publisher.id; authorIds=@($author.id) } $adminToken
    Check 'User-issued admin token authorizes catalog writes' ([bool]$book.id)
    $stock = Call POST '/api/inventory/import' @{ bookId=$book.id; quantity=5; note='HTTP integration' } $adminToken
    Check 'Import actual stock' ($stock.quantity -eq 5)
    $cart = Call POST '/api/cart/items?userId=99999' @{ bookId=$book.id; quantity=2 } $customerToken
    Check 'Cart reads catalog prices through HTTP' ($cart.totalAmount -eq 200000)
    $order = Call POST '/api/orders' @{ shippingAddress='Hanoi'; paymentMethod='COD' } $customerToken
    Check 'Checkout total includes server-calculated shipping' ($order.totalAmount -eq 230000 -and $order.shippingCost -eq 30000)
    $mine = @(Call GET '/api/orders/my' $null $customerToken)
    Check 'Customer identity comes from JWT' ($mine.Count -eq 1 -and $mine[0].userId -eq $customer.userId)
    $denied = $false
    try { Call PATCH "/api/orders/$($order.orderId)/status" @{ status='CONFIRMED' } $customerToken | Out-Null } catch { $denied = [int]$_.Exception.Response.StatusCode -eq 403 }
    Check 'Customer cannot confirm their own order' $denied
    1..2 | ForEach-Object { Call PATCH "/api/orders/$($order.orderId)/status" @{ status='CONFIRMED' } $adminToken | Out-Null }
    $stock = Call GET "/api/inventory/$($book.id)"
    Check 'Order-to-inventory service token deducts once' ($stock.quantity -eq 3)
    Call POST "/api/orders/$($order.orderId)/cancel" $null $customerToken | Out-Null
    $stock = Call GET "/api/inventory/$($book.id)"
    Check 'Cancellation restores actual stock' ($stock.quantity -eq 5)
    Call POST '/api/cart/items' @{ bookId=$book.id; quantity=2 } $customerToken | Out-Null
    $second = Call POST '/api/orders' @{ shippingAddress='Hanoi'; paymentMethod='COD' } $customerToken
    foreach ($status in @('CONFIRMED','PREPARING','SHIPPING','DELIVERED')) { $delivered = Call PATCH "/api/orders/$($second.orderId)/status" @{ status=$status } $adminToken }
    Check 'Delivered COD becomes paid' ($delivered.paymentStatus -eq 'PAID')
    $stats = Call GET '/api/stats/overview' $null $adminToken
    Check 'Statistics come from paid orders' ($stats.totalRevenue -eq 230000)
    $advice = Call POST '/api/ai/chat' @{ message='HTTP integration Java' } $customerToken
    Check 'AI authenticates and reads actual catalog with fallback' ($advice.degraded -eq $true -and $advice.books.Count -ge 1)
    # Verify access before and after revocation across every service route. The
    # databases and Redis container are disposable and never touch live data.
    Call POST '/api/auth/logout' $null $customerToken | Out-Null
    Check-Status 'Revoked customer token rejected on Orders' GET '/api/orders/my' $customerToken 401
    Check-Status 'Revoked customer token rejected on Cart' GET '/api/cart' $customerToken 401
    Check-Status 'Revoked customer token rejected on User' GET '/api/users/me' $customerToken 401
    Check-Status 'Revoked customer token rejected on AI' POST '/api/ai/chat' $customerToken 401 @{ message='HTTP integration Java' }
    Check-Status 'Another session still works after customer logout' GET '/api/stats/overview' $adminToken 200
    $nextLogin = Call POST '/api/auth/login' @{ usernameOrEmail='httpcustomer'; password='HttpCustomer@123456' }
    Check 'New login has a distinct access token' ($nextLogin.accessToken -ne $customerToken)
    Check-Status 'Fresh customer token works after signing in again' GET '/api/orders/my' $nextLogin.accessToken 200
    Call POST '/api/auth/logout' $null $adminToken | Out-Null
    Check-Status 'Revoked admin token rejected on Inventory' GET '/api/inventory/transactions' $adminToken 401
    Check-Status 'Revoked admin token rejected on Catalog writes' POST '/api/catalog/categories' $adminToken 401 @{ name='must-not-be-created' }
    Check-Status 'Revoked admin token rejected on Statistics' GET '/api/stats/overview' $adminToken 401
    Check-Status 'Anonymous catalog remains public after logout' GET '/api/catalog/books?page=0&size=1' '' 200
    # Stop only the Redis instance created above; no production dependency is touched.
    & docker stop $redisContainerId | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Cannot stop isolated Redis for outage check.' }
    $redisContainerId = $null # --rm removed it.
    Check-Status 'Redis outage returns 503 instead of forwarding token' GET '/api/orders/my' $nextLogin.accessToken 503
    Check-Status 'Anonymous catalog remains available during Redis outage' GET '/api/catalog/books?page=0&size=1' '' 200
    @{ passed=$results.Count; checks=$results; database='H2'; redis='isolated Redis 7 container, then outage'; gemini='disabled' } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath '.cache/http-integration-results.json' -Encoding UTF8
    Write-Output "HTTP_INTEGRATION_PASSED=$($results.Count)"
} finally {
    foreach ($owned in $processes) {
        $live = Get-Process -Id $owned.Id -ErrorAction SilentlyContinue
        if ($live) { Stop-Process -Id $owned.Id -Force -ErrorAction Continue; Write-Output "CLEANUP: $($owned.Id)" }
    }
    if ($redisContainerId -and $redisContainerId -match '^[a-f0-9]{64}$') {
        & docker rm -f $redisContainerId | Out-Null
    }
}
