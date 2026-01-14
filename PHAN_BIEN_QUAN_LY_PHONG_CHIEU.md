 # 🎬 TÀI LIỆU PHẢN BIỆN: QUẢN LÝ PHÒNG CHIẾU

## 📋 MỤC LỤC
1. [Tổng quan nghiệp vụ](#1-tổng-quan-nghiệp-vụ)
2. [Cấu trúc dữ liệu](#2-cấu-trúc-dữ-liệu)
3. [Các chức năng chính](#3-các-chức-năng-chính)
4. [Luồng nghiệp vụ](#4-luồng-nghiệp-vụ)
5. [Code liên quan](#5-code-liên-quan)
6. [Câu hỏi thường gặp khi phản biện](#6-câu-hỏi-thường-gặp-khi-phản-biện)

---

## 1. TỔNG QUAN NGHIỆP VỤ

### 1.1. Mục đích
Hệ thống quản lý phòng chiếu cho phép admin:
- **Quản lý thông tin phòng chiếu**: Tên, số phòng, loại phòng (Standard/VIP/IMAX/4DX)
- **Thiết kế sơ đồ ghế**: Tùy chỉnh layout, số dãy, số ghế mỗi dãy, ghế đôi
- **Quản lý trạng thái**: Hoạt động, bảo trì, vô hiệu hóa
- **Theo dõi ghế hỏng**: Đánh dấu và ngăn đặt ghế đang bảo trì
- **Tính giá động**: Hệ số giá theo loại phòng (VIP ×1.5, IMAX ×2.0)
- **Thống kê hiệu suất**: Doanh thu, số suất chiếu, tỷ lệ lấp đầy

### 1.2. Đặc điểm nổi bật
✅ **Visual Seat Designer**: Admin thiết kế sơ đồ ghế trực quan  
✅ **Nhiều layout templates**: Default, Single-column, Two-columns, Stadium  
✅ **Ghế đôi tự động**: Chọn 1 ghế → tự động chọn ghế cặp  
✅ **Validation thông minh**: Không cho xóa phòng có show tương lai  
✅ **Bảo trì linh hoạt**: Chuyển phòng sang maintenance với ghi chú  

---

## 2. CẤU TRÚC DỮ LIỆU

### 2.1. Model CinemaHall (`server/models/CinemaHall.js`)

```javascript
{
  name: String,                    // "Phòng VIP 1"
  hallNumber: Number (unique),      // 1, 2, 3...
  type: String,                     // "Standard" | "VIP" | "IMAX" | "4DX"
  totalSeats: Number,               // Tổng số ghế
  
  // Sơ đồ ghế
  seatLayout: {
    rows: [String],                 // ["A", "B", "C", ...]
    seatsPerRow: Number,            // Số ghế mỗi dãy (mặc định)
    coupleSeatsRows: [String],      // Dãy có ghế đôi: ["L"]
    layoutType: String              // "default" | "single-column" | "two-columns" | "theater-v"
  },
  
  customRowSeats: Object,           // Số ghế tùy chỉnh: { "A": 6, "B": 8 }
  priceMultiplier: Number,          // VIP: 1.5, IMAX: 2.0
  status: String,                   // "active" | "maintenance" | "inactive"
  brokenSeats: [String],             // ["A1", "B5", "C10"]
  maintenanceNote: String,           // "Sửa chữa hệ thống âm thanh"
  maintenanceStartDate: Date,
  maintenanceEndDate: Date
}
```

### 2.2. Liên kết với Show Model

```javascript
// Show Model có trường:
hall: ObjectId (ref: "CinemaHall")  // Tham chiếu đến phòng chiếu
```

**Quan hệ:**
- 1 Phòng chiếu → Nhiều Suất chiếu (Show)
- Khi tạo Show phải chọn Hall
- Khi xóa Hall phải kiểm tra không có Show tương lai

---

## 3. CÁC CHỨC NĂNG CHÍNH

### 3.1. CRUD Phòng Chiếu

#### ✅ **Tạo phòng mới** (`POST /api/hall/create`)
**Luồng:**
1. Admin nhập thông tin: tên, số phòng, loại, hệ số giá
2. Thiết kế sơ đồ ghế bằng **SeatLayoutDesigner**:
   - Chọn template hoặc tự thiết kế
   - Chọn số dãy, số ghế mỗi dãy
   - Đánh dấu dãy có ghế đôi
   - Đánh dấu ghế hỏng (nếu có)
3. Backend validate:
   - Số phòng phải unique
   - Tổng số ghế = tổng từ seatLayout
4. Lưu vào DB

**Code:**
- Frontend: `client/src/components/admin/AddEditCinemaHallModal.jsx`
- Backend: `server/controllers/cinemaHallController.js` → `createHall()`

#### ✅ **Cập nhật phòng** (`PUT /api/hall/:hallId`)
- Cập nhật thông tin, sơ đồ ghế, ghế hỏng
- Validate số phòng không trùng với phòng khác

#### ✅ **Xóa/Vô hiệu hóa phòng** (`DELETE /api/hall/:hallId`)
**Validation quan trọng:**
```javascript
// Kiểm tra có show tương lai không
const futureShows = await Show.countDocuments({
  hall: hallId,
  showDateTime: { $gte: new Date() }
});

if (futureShows > 0) {
  return "Không thể xóa. Có X suất chiếu đã lên lịch"
}
```
→ **Soft delete**: Chuyển status = "inactive" thay vì xóa thật

#### ✅ **Xem danh sách phòng** (`GET /api/hall/all`)
- Filter theo status, type
- Hiển thị thống kê: số suất chiếu, doanh thu, ghế đã bán

### 3.2. Quản lý Trạng thái

#### ✅ **Chuyển đổi trạng thái** (`PATCH /api/hall/:hallId/status`)
**3 trạng thái:**
- **active**: Phòng hoạt động bình thường
- **maintenance**: Phòng đang bảo trì
  - Yêu cầu nhập `maintenanceNote`
  - Lưu `maintenanceStartDate`, `maintenanceEndDate`
- **inactive**: Phòng vô hiệu hóa (không dùng nữa)

**Validation:**
- Không cho tạo Show trong phòng maintenance
- User không thấy shows của phòng maintenance

**Code:** `server/controllers/cinemaHallController.js` → `toggleHallStatus()`

### 3.3. Quản lý Ghế Hỏng

**Cách hoạt động:**
1. Admin đánh dấu ghế hỏng trong form: `brokenSeats: ["A1", "B5"]`
2. Khi user chọn ghế, hệ thống kiểm tra:
   ```javascript
   if(hall?.brokenSeats?.includes(seatId)) {
     return toast.error("Ghế này đang bảo trì, không thể đặt")
   }
   ```
3. Ghế hỏng không hiển thị trong sơ đồ hoặc hiển thị màu đỏ (disabled)

**Code:** `client/src/pages/SeatLayout.jsx` → `handleSeatClick()`

### 3.4. Thiết kế Sơ đồ Ghế

#### **SeatLayoutDesigner Component**
**Tính năng:**
- Chọn template có sẵn hoặc tự thiết kế
- Thêm/xóa dãy ghế
- Tùy chỉnh số ghế mỗi dãy (customRowSeats)
- Đánh dấu dãy có ghế đôi
- Đánh dấu ghế hỏng

**Templates có sẵn:**
1. **Default**: 8 dãy × 9 ghế, 2 dãy đầu ở giữa, các dãy sau chia 2 cột
2. **Single-column**: Tất cả thẳng hàng ở giữa
3. **Two-columns**: Chia 2 cột bằng nhau, không có dãy giữa
4. **Stadium**: Dạng sân vận động, tăng dần từ trước ra sau

**Code:** `client/src/lib/seatLayoutTemplates.js`

### 3.5. Tính Giá Động

**Công thức:**
```
Giá vé = (Giá cơ bản × priceMultiplier) + Phụ thu ghế đôi + Phụ thu suất tối
```

**Ví dụ:**
- Phòng Standard: `priceMultiplier = 1.0`
- Phòng VIP: `priceMultiplier = 1.5`
- Phòng IMAX: `priceMultiplier = 2.0`

**Code:** `server/controllers/showController.js` → `getShowByMovieId()`
```javascript
const displayPrice = basePrice * show.hall.priceMultiplier;
```

### 3.6. Thống kê Phòng Chiếu

#### ✅ **Thống kê 1 phòng** (`GET /api/hall/:hallId/statistics`)
**Metrics:**
- Tổng số suất chiếu
- Tổng doanh thu (chỉ bookings đã thanh toán)
- Tổng số ghế đã bán
- Tổng số ghế có sẵn
- Tỷ lệ lấp đầy (occupancyRate)
- Doanh thu trung bình mỗi suất

#### ✅ **Thống kê tất cả phòng** (`GET /api/hall/statistics/all`)
- Tổng hợp thống kê của tất cả phòng
- Hiển thị trong bảng quản lý

**Code:** `server/controllers/cinemaHallController.js` → `getHallStatistics()`, `getAllHallsStatistics()`

---

## 4. LUỒNG NGHIỆP VỤ

### 4.1. Luồng Tạo Phòng Mới

```
1. Admin → "Quản lý phòng chiếu" → "Thêm phòng mới"
2. Nhập thông tin: tên, số phòng, loại, hệ số giá
3. Thiết kế sơ đồ ghế:
   - Chọn template hoặc tự thiết kế
   - Thêm/xóa dãy
   - Tùy chỉnh số ghế mỗi dãy
   - Đánh dấu dãy ghế đôi (nếu có)
   - Đánh dấu ghế hỏng (nếu có)
4. Click "Lưu"
5. Backend validate:
   - Số phòng unique?
   - Tổng số ghế hợp lệ?
6. Lưu vào DB
7. Hiển thị trong danh sách
```

### 4.2. Luồng Tạo Show với Phòng Chiếu

```
1. Admin → "Thêm suất chiếu"
2. Chọn phim, chọn phòng chiếu (dropdown)
3. Nhập giá vé, ngày-giờ chiếu
4. Backend validate:
   - Phòng có tồn tại?
   - Phòng có đang maintenance? → Báo lỗi
   - Có xung đột lịch chiếu? → Kiểm tra overlap
5. Tạo Show với hall = hallId
6. User có thể đặt vé cho show này
```

**Code:** `server/controllers/showController.js` → `addShows()`

### 4.3. Luồng Đặt Vé với Phòng Chiếu

```
1. User chọn phim → Xem chi tiết
2. Chọn ngày-giờ chiếu
3. Hệ thống load:
   - Thông tin phòng (hall)
   - Sơ đồ ghế (seatLayout)
   - Ghế đã đặt (occupiedSeats)
   - Ghế hỏng (brokenSeats)
4. User chọn ghế:
   - Ghế thường: chọn từng ghế
   - Ghế đôi: chọn 1 → tự động chọn cặp
   - Validate: không chọn ghế hỏng, không chọn ghế đã đặt
5. Tính giá:
   - Giá base × priceMultiplier
   - + Phụ thu ghế đôi (nếu có)
   - + Phụ thu suất tối (nếu có)
6. Thanh toán → Tạo Booking
```

**Code:** `client/src/pages/SeatLayout.jsx`

### 4.4. Luồng Bảo trì Phòng

```
1. Admin → "Quản lý phòng chiếu"
2. Click icon "Bảo trì" trên phòng
3. Nhập lý do bảo trì
4. Backend:
   - Update status = "maintenance"
   - Lưu maintenanceNote, maintenanceStartDate
5. Hệ thống:
   - Không cho tạo Show mới trong phòng này
   - Ẩn các Show hiện tại của phòng này (user không thấy)
   - Hiển thị badge "Bảo trì" trong danh sách
6. Khi sửa xong → Click "Kích hoạt" → status = "active"
```

---

## 5. CODE LIÊN QUAN

### 5.1. Backend

#### **Model**
- `server/models/CinemaHall.js` - Schema phòng chiếu

#### **Controller**
- `server/controllers/cinemaHallController.js` - Tất cả logic quản lý phòng
  - `getAllHalls()` - Lấy danh sách
  - `getHallById()` - Lấy chi tiết
  - `createHall()` - Tạo mới
  - `updateHall()` - Cập nhật
  - `deleteHall()` - Xóa (soft delete)
  - `toggleHallStatus()` - Chuyển trạng thái
  - `getHallStatistics()` - Thống kê 1 phòng
  - `getAllHallsStatistics()` - Thống kê tất cả

#### **Routes**
- `server/routes/cinemaHallRoutes.js` - Định nghĩa API endpoints

#### **Tích hợp với Show**
- `server/controllers/showController.js`:
  - `addShows()` - Validate phòng khi tạo show
  - `getShowByMovieId()` - Populate hall info, tính giá theo priceMultiplier

### 5.2. Frontend

#### **Pages**
- `client/src/pages/admin/ListCinemaHalls.jsx` - Trang quản lý danh sách phòng

#### **Components**
- `client/src/components/admin/AddEditCinemaHallModal.jsx` - Modal thêm/sửa phòng
- `client/src/components/admin/SeatLayoutDesigner.jsx` - Component thiết kế sơ đồ ghế

#### **Tích hợp với Đặt vé**
- `client/src/pages/SeatLayout.jsx`:
  - Load hall info từ show
  - Render sơ đồ ghế theo layoutType
  - Validate ghế hỏng, ghế đôi
  - Tính giá theo priceMultiplier

#### **Templates**
- `client/src/lib/seatLayoutTemplates.js` - Các template layout có sẵn

### 5.3. API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/hall/all` | Lấy tất cả phòng | Public |
| GET | `/api/hall/:hallId` | Lấy chi tiết 1 phòng | Public |
| GET | `/api/hall/:hallId/statistics` | Thống kê 1 phòng | Public |
| GET | `/api/hall/statistics/all` | Thống kê tất cả | Public |
| POST | `/api/hall/create` | Tạo phòng mới | Admin |
| PUT | `/api/hall/:hallId` | Cập nhật phòng | Admin |
| DELETE | `/api/hall/:hallId` | Xóa phòng | Admin |
| PATCH | `/api/hall/:hallId/status` | Chuyển trạng thái | Admin |

---

## 6. CÂU HỎI THƯỜNG GẶP KHI PHẢN BIỆN

### ❓ **Câu 1: "Em quản lý phòng chiếu bằng cách nào?"**

**Trả lời:**
> "Em quản lý phòng chiếu thông qua hệ thống CRUD đầy đủ với các tính năng:
> 
> 1. **Tạo và cấu hình phòng**: Admin có thể tạo phòng mới với thông tin cơ bản (tên, số phòng, loại) và thiết kế sơ đồ ghế trực quan bằng component SeatLayoutDesigner. Em hỗ trợ nhiều template layout như Default, Single-column, Two-columns, Stadium.
> 
> 2. **Quản lý trạng thái**: Phòng có 3 trạng thái - active (hoạt động), maintenance (bảo trì), inactive (vô hiệu hóa). Khi chuyển sang maintenance, hệ thống yêu cầu nhập lý do và tự động ẩn các show của phòng đó khỏi user.
> 
> 3. **Quản lý ghế hỏng**: Admin có thể đánh dấu các ghế đang bảo trì. Khi user cố đặt ghế hỏng, hệ thống sẽ chặn và thông báo lỗi.
> 
> 4. **Tính giá động**: Mỗi phòng có hệ số giá (priceMultiplier). Khi tạo show, giá vé = giá cơ bản × hệ số. Ví dụ VIP ×1.5, IMAX ×2.0.
> 
> 5. **Validation thông minh**: Không cho xóa phòng nếu có show tương lai, không cho tạo show trong phòng đang bảo trì.
> 
> 6. **Thống kê**: Hệ thống cung cấp thống kê doanh thu, số suất chiếu, tỷ lệ lấp đầy cho từng phòng."

### ❓ **Câu 2: "Nghiệp vụ quản lý phòng chiếu như thế nào?"**

**Trả lời:**
> "Nghiệp vụ quản lý phòng chiếu của em bao gồm:
> 
> **1. Quản lý thông tin phòng:**
> - Mỗi phòng có: tên, số phòng (unique), loại (Standard/VIP/IMAX/4DX), hệ số giá
> - Số phòng phải unique để tránh nhầm lẫn
> 
> **2. Quản lý sơ đồ ghế:**
> - Admin thiết kế layout: số dãy, số ghế mỗi dãy
> - Hỗ trợ ghế đôi: đánh dấu dãy có ghế đôi, khi user chọn 1 ghế → tự động chọn cặp
> - Hỗ trợ layout linh hoạt: có thể tùy chỉnh số ghế khác nhau cho từng dãy
> 
> **3. Quản lý trạng thái:**
> - **Active**: Phòng hoạt động bình thường, có thể tạo show và đặt vé
> - **Maintenance**: Phòng đang bảo trì, không cho tạo show mới, ẩn show hiện tại
> - **Inactive**: Phòng vô hiệu hóa, không dùng nữa
> 
> **4. Quản lý ghế hỏng:**
> - Admin đánh dấu ghế hỏng trong form
> - Khi đặt vé, hệ thống kiểm tra và chặn ghế hỏng
> - Ghế đôi: nếu 1 trong 2 ghế hỏng → không thể đặt cả cặp
> 
> **5. Tính giá động:**
> - Giá vé = (Giá cơ bản × priceMultiplier) + Phụ thu
> - Mỗi loại phòng có hệ số riêng: Standard 1.0, VIP 1.5, IMAX 2.0
> 
> **6. Validation nghiệp vụ:**
> - Không xóa phòng có show tương lai (phải chuyển sang maintenance trước)
> - Không tạo show trong phòng maintenance
> - Kiểm tra xung đột lịch chiếu khi tạo show (2 show không trùng thời gian trong cùng phòng)"

### ❓ **Câu 3: "Em xử lý ghế đôi như thế nào?"**

**Trả lời:**
> "Em xử lý ghế đôi như sau:
> 
> 1. **Cấu hình**: Admin đánh dấu dãy có ghế đôi trong `coupleSeatsRows` (ví dụ: ["L"])
> 
> 2. **Logic chọn ghế**: Khi user click vào 1 ghế trong dãy ghế đôi:
>    - Hệ thống tự động xác định ghế cặp (số lẻ → số chẵn, số chẵn → số lẻ)
>    - Tự động chọn/bỏ chọn cả 2 ghế cùng lúc
>    - Validate: nếu 1 trong 2 ghế đã được đặt hoặc hỏng → không thể chọn
> 
> 3. **Tính giá**: Ghế đôi có phụ thu 10,000 VNĐ mỗi ghế
> 
> 4. **Code**: Em xử lý trong `SeatLayout.jsx`, hàm `handleSeatClick()`:
>    ```javascript
>    const isCoupleSeat = hall?.seatLayout?.coupleSeatsRows?.includes(row);
>    if(isCoupleSeat) {
>      const coupleSeat = isOddSeat ? `${row}${seatNum + 1}` : `${row}${seatNum - 1}`;
>      // Toggle cả 2 ghế
>    }
>    ```"

### ❓ **Câu 4: "Em validate phòng chiếu như thế nào?"**

**Trả lời:**
> "Em có nhiều lớp validation:
> 
> **1. Khi tạo phòng:**
>    - Số phòng phải unique (không trùng với phòng khác)
>    - Tổng số ghế phải hợp lệ (tính từ seatLayout)
> 
> **2. Khi xóa phòng:**
>    - Kiểm tra có show tương lai không:
>      ```javascript
>      const futureShows = await Show.countDocuments({
>        hall: hallId,
>        showDateTime: { $gte: new Date() }
>      });
>      ```
>    - Nếu có → Báo lỗi, yêu cầu chuyển sang maintenance thay vì xóa
> 
> **3. Khi tạo show:**
>    - Kiểm tra phòng có tồn tại
>    - Kiểm tra phòng không đang maintenance
>    - Kiểm tra xung đột lịch chiếu (2 show không trùng thời gian)
> 
> **4. Khi đặt vé:**
>    - Kiểm tra ghế không hỏng
>    - Kiểm tra ghế chưa được đặt
>    - Kiểm tra ghế đôi: cả 2 ghế phải available"

### ❓ **Câu 5: "Em tính giá vé theo phòng như thế nào?"**

**Trả lời:**
> "Em tính giá vé động theo công thức:
> 
> ```
> Giá vé = (Giá cơ bản × priceMultiplier) + Phụ thu ghế đôi + Phụ thu suất tối
> ```
> 
> **Ví dụ:**
> - Giá cơ bản: 100,000 VNĐ
> - Phòng VIP (priceMultiplier = 1.5)
> - Ghế đôi: +10,000 VNĐ/ghế
> - Suất tối: +10,000 VNĐ/ghế
> 
> → Giá vé = (100,000 × 1.5) + 10,000 + 10,000 = 170,000 VNĐ
> 
> **Code**: Trong `showController.js`, khi lấy show:
> ```javascript
> const displayPrice = basePrice * show.hall.priceMultiplier;
> ```
> 
> Sau đó frontend cộng thêm phụ thu ghế đôi và suất tối."

### ❓ **Câu 6: "Em quản lý layout ghế như thế nào?"**

**Trả lời:**
> "Em quản lý layout ghế linh hoạt:
> 
> **1. Templates có sẵn:**
>    - Default: 2 dãy đầu ở giữa, các dãy sau chia 2 cột
>    - Single-column: Tất cả thẳng hàng ở giữa
>    - Two-columns: Chia 2 cột bằng nhau
>    - Stadium: Dạng sân vận động, tăng dần từ trước ra sau
> 
> **2. Tùy chỉnh:**
>    - Admin có thể tự thiết kế: thêm/xóa dãy, thay đổi số ghế mỗi dãy
>    - `customRowSeats`: Cho phép mỗi dãy có số ghế khác nhau
>    - Ví dụ: Dãy A có 6 ghế, dãy B có 8 ghế, dãy C có 10 ghế
> 
> **3. Render động:**
>    - Frontend đọc `layoutType` để render đúng layout
>    - Tính toán padding để căn giữa các dãy có ít ghế hơn
>    - Hiển thị ghế hỏng với màu đỏ (disabled)
> 
> **Code**: `SeatLayout.jsx` → `renderSeats()` và `groupRows` logic"

---

## 📝 TÓM TẮT ĐIỂM MẠNH

✅ **Quản lý đầy đủ**: CRUD + Trạng thái + Ghế hỏng  
✅ **Thiết kế linh hoạt**: Visual designer + Templates + Custom layout  
✅ **Validation chặt chẽ**: Không xóa phòng có show, không tạo show trong phòng maintenance  
✅ **Tính giá động**: Hệ số giá theo loại phòng  
✅ **Thống kê chi tiết**: Doanh thu, tỷ lệ lấp đầy theo từng phòng  
✅ **UX tốt**: Ghế đôi tự động, hiển thị ghế hỏng, layout đẹp  

---

## 🎯 LƯU Ý KHI PHẢN BIỆN

1. **Nhấn mạnh tính năng nổi bật**: Visual Seat Designer, Ghế đôi tự động
2. **Giải thích rõ validation**: Tại sao không cho xóa phòng có show tương lai
3. **Demo nếu có thể**: Show cách thiết kế sơ đồ ghế, chuyển trạng thái
4. **Nói về tích hợp**: Phòng chiếu liên kết với Show, Booking như thế nào
5. **Thống kê**: Có thể nói về metrics theo dõi hiệu suất phòng

---

**Chúc bạn phản biện thành công! 🎉**

