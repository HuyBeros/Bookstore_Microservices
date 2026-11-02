# 🛑 CÁCH TẮT TOÀN BỘ HỆ THỐNG

## 🎯 PHƯƠNG PHÁP NHANH

### Option 1: Tắt từng service (Ctrl+C)

Mỗi service đang chạy trong một cửa sổ PowerShell riêng:

1. **Tìm cửa sổ PowerShell** đang chạy service
2. Click vào cửa sổ đó để focus
3. Nhấn **Ctrl + C**
4. Đợi service dừng (thấy prompt trở lại)
5. Lặp lại cho tất cả các service khác

**Danh sách services cần tắt:**
- [ ] Eureka Server (port 8761)
- [ ] API Gateway (port 8080)
- [ ] User Service (port 8081)
- [ ] Catalog Service (port 8082)
- [ ] Order Service (port 8083)
- [ ] Inventory Service (port 8084)
- [ ] AI Service (port 8085)

---

### Option 2: Dùng Task Manager (Nhanh nhất)

1. Nhấn **Ctrl + Shift + Esc** để mở Task Manager
2. Tab **Details**
3. Tìm tất cả process **java.exe**
4. Click chuột phải → **End Task** cho từng process
5. Hoặc chọn nhiều process (giữ Ctrl + click) → **End Task**

⚠️ **Lưu ý:** Nếu có Java apps khác đang chạy, hãy cẩn thận không kill nhầm!

---

### Option 3: PowerShell Script (Tự động)

Tạo file `stop-all-services.ps1`:

```powershell
Write-Host "Dang tat tat ca Java services..." -ForegroundColor Yellow

# Lay tat ca process Java dang chay cac port
$ports = @(8761, 8080, 8081, 8082, 8083, 8084, 8085)

foreach ($port in $ports) {
    Write-Host "Kiem tra port $port..." -ForegroundColor Cyan
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Host "  Dang tat $($process.ProcessName) (PID: $processId) tren port $port" -ForegroundColor Red
                Stop-Process -Id $processId -Force
                Write-Host "  Da tat!" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  Khong co service nao dang chay tren port $port" -ForegroundColor Gray
    }
}

Write-Host "`nTat ca services da duoc dung!" -ForegroundColor Green
Write-Host "Ban co the dong cac cua so PowerShell con lai." -ForegroundColor Yellow
```

**Chạy:**
```powershell
powershell -ExecutionPolicy Bypass -File .\stop-all-services.ps1
```

---

### Option 4: Kill tất cả Java processes (Cực mạnh)

⚠️ **Nguy hiểm:** Sẽ tắt **TẤT CẢ** Java processes!

```powershell
# Tat tat ca process Java
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Da tat tat ca Java processes!" -ForegroundColor Green
```

---

## 🐳 TẮT DOCKER CONTAINERS

### Option 1: Dừng containers (giữ data)
```powershell
docker compose stop
```

### Option 2: Xóa containers (giữ data trong volumes)
```powershell
docker compose down
```

### Option 3: Xóa containers VÀ data (⚠️ MẤT HẾT DATA!)
```powershell
docker compose down -v
```

---

## 📋 CHECKLIST TẮT TOÀN BỘ HỆ THỐNG

### Bước 1: Tắt Java Services
- [ ] Nhấn Ctrl+C ở mỗi terminal
- [ ] Hoặc dùng Task Manager kill java.exe
- [ ] Hoặc chạy script stop-all-services.ps1

### Bước 2: Tắt Docker
```powershell
docker compose down
```

### Bước 3: Đóng các cửa sổ PowerShell
- [ ] Đóng tất cả terminal/PowerShell windows còn lại

### Bước 4: (Tùy chọn) Dừng Docker Desktop
- Nếu không dùng nữa, có thể tắt Docker Desktop

---

## 🔍 KIỂM TRA ĐÃ TẮT HẾT CHƯA

### Kiểm tra ports
```powershell
# Kiem tra xem con port nao dang mo khong
netstat -ano | findstr "8761 8080 8081 8082 8083 8084 8085"
```

**Nếu không có output** = Tất cả đã tắt!

### Kiểm tra Java processes
```powershell
Get-Process -Name java -ErrorAction SilentlyContinue
```

**Nếu không có kết quả** = Không còn Java process nào!

### Kiểm tra Docker
```powershell
docker compose ps
```

**Nếu tất cả STATUS là "Exited"** hoặc không có containers = Docker đã tắt!

---

## 🔄 KHỞI ĐỘNG LẠI SAU KHI TẮT

Khi muốn chạy lại hệ thống:

### Cách 1: Dùng script tự động
```powershell
# 1. Khoi dong Docker
docker compose up -d

# 2. Khoi dong tat ca services
powershell -ExecutionPolicy Bypass -File .\run-services.ps1
# Chon option 4
```

### Cách 2: Thủ công theo thứ tự
```powershell
# 1. Docker
docker compose up -d

# 2. Eureka Server (doi 10s)
cd eureka-server && .\mvnw.cmd spring-boot:run

# 3. API Gateway (terminal moi)
cd api-gateway && .\mvnw.cmd spring-boot:run

# 4. Cac services khac (moi service 1 terminal)
cd user-services && .\mvnw.cmd spring-boot:run
cd catalog-service && .\mvnw.cmd spring-boot:run
cd order-service && .\mvnw.cmd spring-boot:run
cd inventory-service && .\mvnw.cmd spring-boot:run
cd ai-service && .\mvnw.cmd spring-boot:run
```

---

## 💡 TIPS

### Tắt nhanh trong development:
1. **Ctrl+C** ở tất cả terminals
2. **docker compose stop**
3. Xong!

### Tắt an toàn (lưu state):
1. Logout khỏi frontend (nếu đang login)
2. Đợi các transactions hoàn thành
3. Ctrl+C từng service theo thứ tự ngược:
   - AI Service
   - Inventory Service
   - Order Service
   - Catalog Service
   - User Service
   - API Gateway
   - Eureka Server
4. docker compose down

### Tắt khẩn cấp (khi bị treo):
1. Task Manager → End all java.exe
2. docker compose down -v (nếu cần xóa data)

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Luôn dùng Ctrl+C trước** - đây là cách tắt an toàn nhất
2. **Kill process chỉ khi service bị treo** và không respond Ctrl+C
3. **Không dùng docker compose down -v** trừ khi muốn xóa hết data
4. **Đóng các terminal windows sau khi services đã tắt**

---

## 🆘 NẾU KHÔNG TẮT ĐƯỢC

### Service bị treo, không respond Ctrl+C:
```powershell
# Tim PID cua port
netstat -ano | findstr :8081

# Kill bang PID
taskkill /PID <PID> /F
```

### Port van bi chiem sau khi tat:
```powershell
# Tim va kill tat ca processes dang dung port
$port = 8081
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}
```

---

**Đã tắt xong! Bạn có thể nghỉ ngơi hoặc đóng máy. 😊**
