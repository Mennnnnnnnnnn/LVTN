# 🎬 Hệ Thống Quản Lý Phòng Chiếu

## 📋 Tổng Quan

Hệ thống quản lý phòng chiếu hoàn chỉnh cho phép admin quản lý toàn diện các phòng chiếu, sơ đồ ghế, trạng thái bảo trì và thống kê hiệu suất.

## ✨ Tính Năng Đã Triển Khai

### 1. **CRUD Phòng Chiếu** ✅
- ➕ **Thêm phòng mới**: Form đầy đủ với visual seat designer
- ✏️ **Chỉnh sửa phòng**: Cập nhật thông tin, layout ghế, ghế hỏng
- 🗑️ **Xóa/Vô hiệu hóa phòng**: Soft delete với validation (không cho xóa nếu có show tương lai)
- 📊 **Xem danh sách**: Table với filters (loại, trạng thái) và search

### 2. **Quản Lý Trạng Thái** ✅
- 🔄 **Toggle trạng thái**: Active ↔️ Maintenance với 1 click
- 📝 **Ghi chú bảo trì**: Lưu lý do và thời gian bảo trì
- ⚠️ **Validation**: Ngăn tạo show trong phòng maintenance

### 3. **Thiết Kế Layout Ghế** ✅
- 🎨 **Visual Designer**: Thiết kế trực quan sơ đồ ghế
  - Thêm/xóa dãy ghế (A-Z)
  - Tùy chỉnh số ghế mỗi dãy
  - Đánh dấu dãy ghế đôi (💑)
  - Click để đánh dấu ghế hỏng (màu đỏ ✕)
- 📐 **Flexible Layout**: 
  - Hỗ trợ custom số ghế theo dãy
  - Tự động tính tổng ghế
  - Preview real-time

### 4. **Quản Lý Ghế Hỏng** ✅
- ❌ **Đánh dấu ghế hỏng**: Click trực tiếp trên designer
- 🚫 **Không cho đặt**: Ghế hỏng tự động disabled cho khách
- 🎨 **Hiển thị đặc biệt**: Màu đỏ với icon ✕ trong SeatLayout
- 📋 **Danh sách ghế hỏng**: Thống kê số lượng và danh sách

### 5. **Thống Kê & Báo Cáo** ✅
- 📊 **Dashboard Summary**:
  - Tổng số phòng
  - Số phòng đang hoạt động
  - Số phòng đang bảo trì
  - Tổng số ghế
- 📈 **Thống kê theo phòng**:
  - Số suất chiếu
  - Tổng doanh thu
  - Số ghế đã bán
  - Tỷ lệ lấp đầy (occupancy rate)
  - Doanh thu trung bình/suất

### 6. **UI/UX Tối Ưu** ✅
- 🎨 **Modern Design**: Gradient cards, icons, badges
- 📱 **Responsive**: Hoạt động tốt trên mobile/tablet
- 🔍 **Search & Filter**: Tìm kiếm nhanh, lọc theo loại/trạng thái
- 🎯 **Visual Feedback**: Toast notifications, loading states
- 🖼️ **Modal Form**: Form đẹp với scroll cho nội dung dài

---

## 🗂️ Cấu Trúc Code

### Backend Files

#### 1. **Model** - `server/models/CinemaHall.js`
```javascript
{
  name: String,
  hallNumber: Number (unique),
  type: String, // Standard, VIP, IMAX, 4DX
  totalSeats: Number,
  seatLayout: {
    rows: [String],
    seatsPerRow: Number,
    coupleSeatsRows: [String]
  },
  customRowSeats: Object, // { "L": 6 }
  priceMultiplier: Number,
  status: String, // active, maintenance, inactive
  brokenSeats: [String], // ["A1", "B5"] ⭐ NEW
  maintenanceNote: String, // ⭐ NEW
  maintenanceStartDate: Date, // ⭐ NEW
  maintenanceEndDate: Date // ⭐ NEW
}
```

#### 2. **Controller** - `server/controllers/cinemaHallController.js`
- `getAllHalls()` - Lấy tất cả phòng (với filters)
- `getHallById()` - Lấy chi tiết 1 phòng
- `createHall()` - Tạo phòng mới ⭐ NEW
- `updateHall()` - Cập nhật phòng ⭐ NEW
- `deleteHall()` - Xóa/disable phòng ⭐ NEW
- `toggleHallStatus()` - Toggle active/maintenance ⭐ NEW
- `getHallStatistics()` - Thống kê 1 phòng ⭐ NEW
- `getAllHallsStatistics()` - Thống kê tổng ⭐ NEW

#### 3. **Routes** - `server/routes/cinemaHallRoutes.js`
```
GET    /api/hall/all
GET    /api/hall/statistics/all
GET    /api/hall/:hallId
GET    /api/hall/:hallId/statistics
POST   /api/hall/create (admin) ⭐ NEW
PUT    /api/hall/:hallId (admin) ⭐ NEW
DELETE /api/hall/:hallId (admin) ⭐ NEW
PATCH  /api/hall/:hallId/status (admin) ⭐ NEW
```

### Frontend Files

#### 1. **Components**
- `SeatLayoutDesigner.jsx` ⭐ NEW
  - Visual seat layout designer
  - Add/remove rows
  - Custom seats per row
  - Mark couple seats
  - Mark broken seats
  
- `AddEditCinemaHallModal.jsx` ⭐ NEW
  - Modal form thêm/sửa phòng
  - Tích hợp SeatLayoutDesigner
  - Validation & error handling

#### 2. **Admin Pages**
- `ListCinemaHalls.jsx` ⭐ NEW
  - Main management page
  - Statistics dashboard
  - Search & filters
  - CRUD actions
  - Table view với thống kê

#### 3. **User Pages**
- `SeatLayout.jsx` (Updated)
  - Thêm check ghế hỏng
  - Hiển thị ghế hỏng (màu đỏ ✕)
  - Không cho đặt ghế hỏng
  - Thêm legend "Bảo trì"

#### 4. **Routes & Navigation**
- `App.jsx` - Thêm route `/admin/cinema-halls`
- `AdminSidebar.jsx` - Thêm menu "Quản lý phòng chiếu"

---

## 🚀 Hướng Dẫn Sử Dụng

### Admin - Quản Lý Phòng Chiếu

#### Thêm Phòng Mới
1. Vào **Admin** → **Quản lý phòng chiếu**
2. Click **"Thêm Phòng Chiếu"**
3. Điền thông tin:
   - Tên phòng: VD "Phòng VIP 1"
   - Số phòng: VD "1"
   - Loại: Standard/VIP/IMAX/4DX
   - Hệ số giá: 1.0-5.0
   - Trạng thái: Hoạt động/Bảo trì
4. Thiết kế layout ghế:
   - Điều chỉnh số dãy (nút +)
   - Điều chỉnh số ghế mỗi dãy
   - Click "💑 Ghế đôi" để đánh dấu dãy ghế đôi
   - Click vào ghế để đánh dấu ghế hỏng
5. Click **"Lưu"**

#### Chỉnh Sửa Phòng
1. Click icon **✏️ Edit** trên dòng phòng
2. Cập nhật thông tin
3. Sửa layout ghế (giữ nguyên hoặc thay đổi)
4. Click **"Lưu"**

#### Đánh Dấu Ghế Hỏng
1. Edit phòng
2. Trong SeatLayoutDesigner, click vào ghế cần đánh dấu hỏng
3. Ghế sẽ chuyển màu đỏ với icon ✕
4. Click lại để bỏ đánh dấu
5. Lưu phòng

#### Toggle Trạng Thái
- Click icon **🔧 Wrench** để chuyển sang bảo trì
- Nhập lý do bảo trì
- Click icon **✓ CheckCircle** để kích hoạt lại

#### Xem Thống Kê
- Thống kê tổng quan hiển thị ở đầu trang
- Thống kê chi tiết từng phòng trong bảng:
  - Số suất chiếu
  - Doanh thu
  - Số ghế đã bán

### Khách Hàng - Đặt Vé

1. Chọn phim và suất chiếu
2. Trong sơ đồ ghế:
   - **Ghế màu đỏ ✕** = Ghế bảo trì (không thể đặt)
   - **Ghế xám** = Đã có người đặt
   - **Ghế viền hồng** = Ghế đôi
   - **Ghế trắng** = Ghế trống
3. Click chọn ghế → Tự động block ghế hỏng

---

## 🎯 Các Case Xử Lý

### Validation Backend
✅ Không cho xóa phòng có show tương lai  
✅ Số phòng phải unique  
✅ Không tạo show trong phòng maintenance  

### Validation Frontend
✅ Không cho đặt ghế hỏng  
✅ Không cho đặt ghế đôi nếu 1 trong 2 ghế hỏng  
✅ Toast error khi click vào ghế hỏng  
✅ Required fields khi thêm/sửa phòng  

### Edge Cases
✅ Phòng cũ giữ nguyên layout  
✅ Phòng mới tự thiết kế layout mới  
✅ Cập nhật ghế hỏng realtime  
✅ Statistics không lỗi khi chưa có show  

---

## 📊 Database Schema Updates

```javascript
// CinemaHall Model - Added Fields
{
  brokenSeats: {
    type: [String],
    default: []
  },
  maintenanceNote: {
    type: String,
    default: ''
  },
  maintenanceStartDate: {
    type: Date
  },
  maintenanceEndDate: {
    type: Date
  }
}
```

---

## 🎨 UI Components Hierarchy

```
ListCinemaHalls (Page)
├── Statistics Cards (4x)
├── Search & Filters Bar
├── Table
│   └── Rows (each hall)
│       ├── Info badges
│       ├── Statistics
│       └── Action buttons
└── AddEditCinemaHallModal
    ├── Basic Info Form
    └── SeatLayoutDesigner
        ├── Config (rows, seats)
        ├── Screen preview
        ├── Row previews
        │   ├── Seat number input
        │   ├── Couple seat toggle
        │   └── Seat grid (clickable)
        └── Broken seats summary
```

---

## 🔗 API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/hall/all` | - | Lấy tất cả phòng |
| GET | `/api/hall/:id` | - | Lấy chi tiết phòng |
| GET | `/api/hall/statistics/all` | - | Thống kê tất cả |
| GET | `/api/hall/:id/statistics` | - | Thống kê 1 phòng |
| POST | `/api/hall/create` | Admin | Tạo phòng mới |
| PUT | `/api/hall/:id` | Admin | Cập nhật phòng |
| DELETE | `/api/hall/:id` | Admin | Xóa phòng |
| PATCH | `/api/hall/:id/status` | Admin | Toggle status |

---

## ✅ Checklist Hoàn Thành

- [x] Cập nhật CinemaHall model để lưu ghế hỏng
- [x] Thêm API CRUD cho cinema halls
- [x] Thêm API thống kê phòng chiếu
- [x] Tạo trang ListCinemaHalls.jsx với table và filters
- [x] Tạo SeatLayoutDesigner component
- [x] Tạo form AddEditCinemaHall với visual seat designer
- [x] Tích hợp trang quản lý vào admin sidebar
- [x] Cập nhật SeatLayout để không cho đặt ghế hỏng
- [x] Hiển thị ghế hỏng với style đặc biệt
- [x] Thêm legend "Bảo trì" trong SeatLayout
- [x] Validation đầy đủ
- [x] Responsive design
- [x] No linting errors

---

## 🎓 Demo Cho Phản Biện

### Luồng Demo Đề Xuất:

1. **Giới thiệu vấn đề** (30s)
   - "Hệ thống cần quản lý phòng chiếu và xử lý ghế hỏng"

2. **Demo quản lý phòng** (2 phút)
   - Show dashboard với statistics
   - Demo search & filter
   - Demo thêm phòng mới với visual designer
   - Demo đánh dấu ghế hỏng
   - Demo toggle maintenance status

3. **Demo trải nghiệm khách** (1 phút)
   - Vào trang đặt vé
   - Show ghế hỏng không thể đặt
   - Demo error message

4. **Show thống kê** (1 phút)
   - Doanh thu theo phòng
   - Tỷ lệ lấp đầy
   - Số show

### Điểm Nhấn Để Nói:
✨ "Hệ thống cho phép admin **tự thiết kế layout ghế trực quan**"  
✨ "Ghế hỏng **tự động blocked** cho khách, không cần manual check"  
✨ "Có **thống kê chi tiết** hiệu suất từng phòng"  
✨ "UI **hiện đại, responsive**, dễ sử dụng"  
✨ "Validation **chặt chẽ** để tránh lỗi nghiệp vụ"

---

## 🚀 Next Steps (Nếu còn thời gian)

- [ ] Export báo cáo PDF
- [ ] Lịch sử bảo trì phòng
- [ ] Notification khi ghế hỏng nhiều
- [ ] Heatmap tỷ lệ lấp đầy theo vị trí ghế
- [ ] Auto-schedule maintenance

---

**Chúc bạn phản biện thành công! 🎉**

