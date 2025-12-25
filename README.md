# 🎬 HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN

## 📋 Giới thiệu

Hệ thống đặt vé xem phim trực tuyến được xây dựng bằng MERN Stack (MongoDB, Express.js, React, Node.js), cho phép người dùng đặt vé xem phim online với đầy đủ tính năng quản lý rạp chiếu phim hiện đại.

### Tính năng chính

#### Người dùng (User)
- ✅ Xem danh sách phim đang chiếu (tích hợp TMDB API)
- ✅ Xem chi tiết phim (thông tin, trailer, diễn viên)
- ✅ Chọn suất chiếu theo ngày, giờ, phòng
- ✅ Chọn ghế ngồi với visualization map
- ✅ Hệ thống ghế đôi (couple seats)
- ✅ Thanh toán trực tuyến qua Stripe
- ✅ Nhận email xác nhận có QR code
- ✅ Quản lý lịch sử đặt vé
- ✅ Yêu thích phim

#### Quản trị viên (Admin)
- ✅ Dashboard thống kê tổng quan
- ✅ Quản lý phim và suất chiếu
- ✅ Quản lý 5 phòng chiếu (Standard, VIP, IMAX)
- ✅ Phát hiện xung đột lịch chiếu
- ✅ Quản lý giá vé động theo loại phòng
- ✅ Xem danh sách đặt vé
- ✅ Báo cáo doanh thu

### Công nghệ sử dụng

**Frontend:**
- React 19.2.0
- React Router DOM 7.9.5
- Tailwind CSS 4.1.17
- Axios
- React Hot Toast
- Clerk Authentication

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- Stripe Payment Gateway
- Inngest (Background Jobs)
- Brevo/Nodemailer (Email Service)
- QRCode Generator

**External APIs:**
- TMDB API (The Movie Database)
- Clerk Authentication
- Stripe Payment
- Brevo Email Service

---

## 🚀 Cài đặt và Chạy dự án

### Yêu cầu hệ thống

- Node.js >= 18.x
- MongoDB (Local hoặc MongoDB Atlas)
- npm hoặc yarn

### 1. Clone dự án

```bash
git clone <repository-url>
cd LVTN
```

### 2. Cài đặt dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 3. Cấu hình Environment Variables

#### Server (.env)
Tạo file `.env` trong thư mục `server/`:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luanvantotnghiep

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# TMDB API
TMDB_API_KEY=eyJhbGciOiJIUzI1NiJ9...

# Stripe Payment
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (Brevo)
SENDER_EMAIL=your-email@example.com
BREVO_API_KEY=xkeysib-...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-prod-...
```

#### Client (.env)
Tạo file `.env` trong thư mục `client/`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_BASE_URL=http://localhost:8080
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
VITE_CURRENCY=$
```

### 4. Seed Database

Chạy script để tạo dữ liệu 5 phòng chiếu:

```bash
cd server
node seed/seedCinemaHalls.js
```

### 5. Chạy ứng dụng

#### Chạy Backend (Terminal 1)
```bash
cd server
npm start
# hoặc development mode với auto-reload:
npm run server
```
Server chạy tại: `http://localhost:8080`

#### Chạy Frontend (Terminal 2)
```bash
cd client
npm run dev
```
Client chạy tại: `http://localhost:5173`

### 6. Tạo Admin Account

1. Đăng ký tài khoản mới tại trang web
2. Truy cập MongoDB và thêm email vào collection `admins`
3. Hoặc config hardcode trong `server/middleware/auth.js`

---

## 📁 Cấu trúc dự án

```
LVTN/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin pages
│   │   │   ├── Home.jsx
│   │   │   ├── Movies.jsx
│   │   │   ├── MovieDetails.jsx
│   │   │   ├── SeatLayout.jsx
│   │   │   └── MyBookings.jsx
│   │   ├── context/        # React Context (AppContext)
│   │   ├── lib/            # Utility functions
│   │   └── App.jsx
│   └── package.json
│
├── server/                 # Backend Node.js
│   ├── controllers/        # Business logic
│   │   ├── showController.js
│   │   ├── bookingController.js
│   │   ├── adminController.js
│   │   └── userController.js
│   ├── models/             # MongoDB Schemas
│   │   ├── Movie.js
│   │   ├── Show.js
│   │   ├── CinemaHall.js
│   │   ├── Booking.js
│   │   └── User.js
│   ├── routes/             # API Routes
│   ├── middleware/         # Auth middleware
│   ├── configs/            # Configuration files
│   ├── inngest/            # Background jobs
│   ├── seed/               # Database seeding
│   └── server.js           # Entry point
│
└── README.md
```

---

## 🎯 Workflow hệ thống

### 1. User đặt vé

```
1. User xem danh sách phim
2. Click vào phim → Xem chi tiết
3. Click "Mua vé" → Chọn ngày
4. Chọn suất chiếu (giờ + phòng)
5. Chọn ghế ngồi trên seat map
6. Xem tổng tiền (có phụ thu ghế đôi + suất tối)
7. Click "Thanh toán" → Chuyển đến Stripe
8. Thanh toán thành công
9. Nhận email xác nhận có QR code
10. Vé được lưu vào "Vé đặt của tôi"
```

### 2. Admin quản lý

```
1. Admin đăng nhập
2. Vào Dashboard → Xem thống kê
3. Thêm suất chiếu:
   - Chọn phim từ TMDB
   - Chọn phòng chiếu
   - Chọn ngày giờ
   - Nhập giá vé cơ bản
   - Hệ thống tự kiểm tra xung đột
4. Xem danh sách đặt vé
5. Xem danh sách suất chiếu
```

---

## 💰 Hệ thống giá vé

### Công thức tính giá

```
Giá cuối = (Giá cơ bản × Hệ số phòng) + Phụ thu ghế đôi + Phụ thu suất tối
```

### Hệ số theo loại phòng

| Loại phòng | Hệ số | Ví dụ (Giá gốc 80.000₫) |
|------------|-------|-------------------------|
| Standard   | ×1    | 80.000₫                 |
| VIP        | ×1.5  | 120.000₫                |
| IMAX       | ×2    | 160.000₫                |

### Phụ thu

- **Ghế đôi:** +10.000₫/ghế
- **Suất tối (sau 17h):** +10.000₫/ghế

### Ví dụ tính giá

**Đặt 2 ghế đôi IMAX vào 19:00**
- Giá cơ bản: 80.000₫
- Giá IMAX: 80.000 × 2 = 160.000₫
- Phụ thu ghế đôi: 10.000₫ × 2 = 20.000₫
- Phụ thu suất tối: 10.000₫ × 2 = 20.000₫
- **Tổng mỗi ghế:** 160.000 + 10.000 + 10.000 = **180.000₫**
- **Tổng 2 ghế:** **360.000₫**

---

## 🎭 Hệ thống phòng chiếu

### 5 Phòng chiếu

| Phòng | Loại     | Số ghế | Ghế đôi | Đặc điểm        |
|-------|----------|--------|---------|-----------------|
| 1     | Standard | 90     | Dãy H, J| 10 dãy × 9 ghế  |
| 2     | Standard | 90     | Dãy H, J| 10 dãy × 9 ghế  |
| 3     | VIP      | 60     | Dãy D, F| 6 dãy × 10 ghế  |
| 4     | IMAX     | 100    | Dãy H, J| 10 dãy × 10 ghế |
| 5     | Standard | 90     | Dãy H, J| 10 dãy × 9 ghế  |

### Conflict Detection

Hệ thống tự động kiểm tra xung đột khi thêm suất chiếu:
- **Thời gian chiếu** = Độ dài phim + 10 phút buffer + 20 phút vệ sinh
- Không cho phép 2 suất chiếu trùng thời gian trong cùng 1 phòng

---

## 📧 Email System

### Email xác nhận đặt vé bao gồm:

- Thông tin phim (tên, thể loại, độ dài)
- Thông tin suất chiếu (ngày, giờ, phòng)
- Danh sách ghế đã đặt
- Tổng tiền thanh toán
- Mã booking
- **QR Code** (để check-in)

### QR Code format:

```json
{
  "bookingId": "...",
  "userId": "...",
  "showId": "...",
  "seats": ["A1", "A2"]
}
```

---

## 🛠️ API Endpoints

Chi tiết xem file [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Main Endpoints

- `GET /api/show/all` - Lấy danh sách phim
- `GET /api/show/:id` - Chi tiết suất chiếu
- `POST /api/booking/create` - Tạo booking
- `POST /api/admin/add-show` - Thêm suất chiếu

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User đăng ký/đăng nhập
- [ ] Xem danh sách phim
- [ ] Xem trailer phim
- [ ] Chọn ghế và đặt vé
- [ ] Thanh toán Stripe
- [ ] Nhận email xác nhận
- [ ] Xem lịch sử đặt vé
- [ ] Admin thêm suất chiếu
- [ ] Admin xem dashboard
- [ ] Conflict detection hoạt động

---

## 🐛 Troubleshooting

### Lỗi thường gặp

**1. Cannot read properties of undefined (reading '_id')**
- Nguyên nhân: Shows cũ không có hall
- Giải pháp: Xóa shows cũ trong MongoDB

**2. Stripe webhook failed**
- Nguyên nhân: STRIPE_WEBHOOK_SECRET sai
- Giải pháp: Lấy webhook secret từ Stripe Dashboard

**3. Email không gửi được**
- Nguyên nhân: BREVO_API_KEY không hợp lệ
- Giải pháp: Kiểm tra lại API key

**4. Trailer không khả dụng**
- Nguyên nhân: Phim không có trailer trên TMDB
- Giải pháp: Chọn phim khác hoặc chạy update trailers

---

## 📊 Database Schema

Chi tiết xem file [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

## 👤 Tác giả

- **Sinh viên:** [Tên của bạn]
- **MSSV:** [Mã số sinh viên]
- **Trường:** [Tên trường]
- **Khoa:** [Tên khoa]
- **Năm:** 2025

---

## 📝 License

Dự án này được tạo ra cho mục đích học tập (Luận văn tốt nghiệp).

---

## 🙏 Acknowledgments

- TMDB API cho dữ liệu phim
- Stripe cho payment gateway
- Clerk cho authentication
- Inngest cho background jobs
