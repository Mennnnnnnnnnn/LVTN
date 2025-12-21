# TÀI LIỆU MÔ TẢ NGHIỆP VỤ VÀ CHỨC NĂNG HỆ THỐNG

## 📋 TỔNG QUAN DỰ ÁN

**Hệ thống đặt vé xem phim (Movie Ticket Booking System)** là một ứng dụng web fullstack cho phép người dùng xem danh sách phim, đặt vé xem phim và quản trị viên quản lý các suất chiếu.

### Công nghệ sử dụng:
- **Frontend**: React + Vite, React Router, Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Authentication**: Clerk (User management & authentication)
- **Payment**: Stripe (Thanh toán online)
- **Email Service**: Brevo (Gửi email xác nhận)
- **Background Jobs**: Inngest (Xử lý bất đồng bộ, scheduled tasks)
- **External API**: TMDB (The Movie Database) - Lấy thông tin phim

---

## 📊 MÔ HÌNH DỮ LIỆU

### 1. **User Model**
Lưu trữ thông tin người dùng trong database (đồng bộ từ Clerk)

**Cấu trúc:**
- `_id` (String): ID người dùng từ Clerk (required)
- `name` (String): Tên người dùng (required)
- `email` (String): Email người dùng (required, unique)
- `image` (String): URL ảnh đại diện (required)

**Đặc điểm:**
- Dữ liệu được đồng bộ tự động từ Clerk qua Inngest webhooks
- Favorites (phim yêu thích) được lưu trong Clerk privateMetadata, không lưu trong DB

### 2. **Movie Model**
Lưu trữ thông tin phim được lấy từ TMDB API

**Cấu trúc:**
- `_id` (String): ID phim từ TMDB (required)
- `title` (String): Tên phim (required)
- `overview` (String): Mô tả phim (required)
- `poster_path` (String): Đường dẫn poster (required)
- `backdrop_path` (String): Đường dẫn ảnh nền (required)
- `release_date` (String): Ngày phát hành (required)
- `original_language` (String): Ngôn ngữ gốc
- `tagline` (String): Câu tagline của phim
- `genres` (Array): Danh sách thể loại (required)
- `casts` (Array): Danh sách diễn viên (required)
- `vote_average` (Number): Điểm đánh giá trung bình (required)
- `runtime` (Number): Thời lượng phim (phút) (required)
- `createdAt`, `updatedAt`: Timestamps tự động

### 3. **Show Model**
Lưu trữ các suất chiếu phim

**Cấu trúc:**
- `movie` (String, ref: Movie): ID phim (required)
- `showDateTime` (Date): Ngày giờ chiếu (required)
- `showPrice` (Number): Giá vé (required)
- `occupiedSeats` (Object): Object chứa thông tin ghế đã được đặt
  - Key: Tên ghế (ví dụ: "A1", "B5")
  - Value: ID người dùng đã đặt ghế đó
  - Default: `{}`

**Đặc điểm:**
- `minimize: false` để giữ nguyên structure của `occupiedSeats` kể cả khi rỗng

### 4. **Booking Model**
Lưu trữ thông tin đặt vé

**Cấu trúc:**
- `user` (String, ref: User): ID người dùng (required)
- `show` (String, ref: Show): ID suất chiếu (required)
- `amount` (Number): Tổng số tiền (required)
- `bookedSeats` (Array): Danh sách ghế đã đặt (required)
- `ispaid` (Boolean): Trạng thái thanh toán (default: false)
- `paymentLink` (String): Link thanh toán Stripe
- `createdAt`, `updatedAt`: Timestamps tự động

---

## 🔐 XÁC THỰC VÀ PHÂN QUYỀN

### Clerk Authentication
- **Xác thực người dùng**: Clerk xử lý đăng nhập, đăng ký, quản lý session
- **User Sync**: Dữ liệu người dùng được đồng bộ tự động vào MongoDB qua Inngest:
  - Event `clerk/user.created` → Tạo user mới trong DB
  - Event `clerk/user.updated` → Cập nhật thông tin user trong DB
  - Event `clerk/user.deleted` → Xóa user khỏi DB

### Phân quyền Admin
- **Middleware `protectAdmin`**: Kiểm tra role trong Clerk privateMetadata
- Chỉ user có `privateMetadata.role === 'admin'` mới truy cập được các route admin
- Frontend tự động redirect về trang chủ nếu user không phải admin cố truy cập `/admin/*`

---

## 👤 CHỨC NĂNG NGƯỜI DÙNG

### 1. **Xem danh sách phim (Home & Movies)**
- **Trang chủ (Home)**: Hero section + Featured movies + Trailers
- **Trang phim (Movies)**: Hiển thị tất cả phim đang có suất chiếu
- **API**: `GET /api/show/all`
  - Lấy tất cả shows có `showDateTime >= hiện tại`
  - Group theo movie, trả về danh sách movie unique

### 2. **Xem chi tiết phim (MovieDetails)**
- Hiển thị thông tin chi tiết: poster, title, overview, genres, casts, rating
- Hiển thị lịch chiếu theo ngày và giờ
- Chức năng yêu thích phim (Heart icon)
- **API**: `GET /api/show/:movieId`
  - Lấy thông tin phim từ DB (nếu chưa có thì fetch từ TMDB)
  - Lấy tất cả shows sắp tới của phim, group theo ngày

### 3. **Yêu thích phim (Favorites)**
- Thêm/xóa phim khỏi danh sách yêu thích
- Dữ liệu lưu trong Clerk `privateMetadata.favorites` (Array of movie IDs)
- **APIs**:
  - `POST /api/user/update-favorite`: Thêm/xóa phim yêu thích
  - `GET /api/user/favorites`: Lấy danh sách phim yêu thích (từ DB)

### 4. **Đặt vé (SeatLayout)**
**Quy trình:**
1. Chọn ngày và giờ chiếu từ danh sách có sẵn
2. Xem sơ đồ ghế, các ghế đã được đặt sẽ bị disable
3. Chọn tối đa 5 ghế ngồi
4. Click "Thanh toán" → Tạo booking và redirect đến Stripe Checkout

**APIs:**
- `GET /api/booking/seats/:showId`: Lấy danh sách ghế đã được đặt
- `POST /api/booking/create`: Tạo booking mới
  - Kiểm tra ghế còn trống không
  - Tạo booking với `ispaid: false`
  - Chiếm giữ ghế trong `Show.occupiedSeats`
  - Tạo Stripe Checkout session (thời hạn 30 phút)
  - Trigger Inngest event `app/checkpayment` để kiểm tra thanh toán sau 10 phút
  - Trả về payment URL để redirect

### 5. **Xem lịch sử đặt vé (MyBookings)**
- Hiển thị tất cả bookings của user (cả đã thanh toán và chưa thanh toán)
- Booking chưa thanh toán có link "Thanh toán ngay" để quay lại Stripe
- **API**: `GET /api/user/bookings`
  - Lấy bookings của user hiện tại, populate show và movie

---

## 👨‍💼 CHỨC NĂNG QUẢN TRỊ VIÊN

### 1. **Dashboard**
Hiển thị tổng quan thống kê:
- Tổng số lượng đặt chỗ (chỉ bookings đã thanh toán)
- Tổng doanh thu
- Số chương trình đang hoạt động
- Tổng số người dùng
- Danh sách các show đang hoạt động

**API**: `GET /api/admin/dashboard`

### 2. **Thêm suất chiếu (AddShows)**
**Quy trình:**
1. Fetch danh sách phim đang chiếu từ TMDB (`GET /api/show/now-playing`)
2. Chọn phim từ danh sách
3. Nhập giá vé
4. Thêm nhiều ngày-giờ chiếu (datetime-local input)
5. Submit → Tạo các Show records trong DB

**Logic backend (`POST /api/show/add`):**
- Nếu phim chưa có trong DB → Fetch từ TMDB API (details + credits) → Tạo Movie record
- Tạo nhiều Show records từ input (mỗi date+time = 1 Show)
- Trigger Inngest event `app/show.added` để gửi email thông báo cho tất cả users

**API**: 
- `GET /api/show/now-playing`: Lấy danh sách phim đang chiếu từ TMDB
- `POST /api/show/add`: Tạo shows mới

### 3. **Danh sách suất chiếu (ListShows)**
- Hiển thị bảng tất cả shows sắp tới
- Thông tin: Tên phim, thời gian chiếu, tổng số ghế đã đặt, doanh thu (số ghế × giá)

**API**: `GET /api/admin/all-shows`

### 4. **Danh sách đặt chỗ (ListBookings)**
- Hiển thị bảng tất cả bookings (cả đã thanh toán và chưa thanh toán)
- Thông tin: Tên người dùng, tên phim, thời gian chiếu, ghế ngồi, số tiền

**API**: `GET /api/admin/all-bookings`

---

## 💳 THANH TOÁN (STRIPE)

### Quy trình thanh toán:
1. User chọn ghế và click "Thanh toán"
2. Backend tạo Booking (ispaid: false) và chiếm giữ ghế
3. Tạo Stripe Checkout Session:
   - Metadata: `bookingId`
   - Success URL: `/loading/my-bookings`
   - Cancel URL: `/my-bookings`
   - Expires: 30 phút
4. User thanh toán trên Stripe Checkout
5. Stripe webhook gửi event `payment_intent.succeeded` về `/api/stripe`
6. Webhook handler:
   - Update booking: `ispaid: true`, `paymentLink: ""`
   - Trigger Inngest event `app/show.booked` để gửi email xác nhận

### Webhook endpoint:
- `POST /api/stripe`: Nhận webhook từ Stripe (raw body)

---

## 🔄 BACKGROUND JOBS (INNGEST)

### 1. **Đồng bộ User từ Clerk**
- **sync-user-from-clerk**: Tạo user trong DB khi Clerk user được tạo
- **update-user-from-clerk**: Cập nhật user trong DB khi Clerk user được cập nhật
- **delete-user-with-clerk**: Xóa user khỏi DB khi Clerk user bị xóa

### 2. **Tự động hủy booking chưa thanh toán**
**Function: `release-seats-delete-booking`**
- Trigger: Event `app/checkpayment` với `bookingId`
- Quy trình:
  1. Đợi 10 phút từ khi booking được tạo
  2. Kiểm tra `booking.ispaid`
  3. Nếu chưa thanh toán:
     - Giải phóng ghế: Xóa các ghế khỏi `Show.occupiedSeats`
     - Xóa booking khỏi DB

**Khi nào trigger:**
- Khi tạo booking mới (`createBooking` controller)

### 3. **Gửi email xác nhận đặt vé**
**Function: `send-booking-confirmation-email`**
- Trigger: Event `app/show.booked` với `bookingId`
- Quy trình:
  1. Lấy booking info (populate show, movie, user)
  2. Gửi email xác nhận đến user với thông tin:
     - Tên phim
     - Ngày giờ chiếu (format VN)
     - Thông tin cảm ơn

**Khi nào trigger:**
- Khi Stripe webhook xác nhận thanh toán thành công

### 4. **Gửi email nhắc nhở trước khi chiếu**
**Function: `send-show-reminders`**
- Trigger: Cron job `0 */8 * * *` (mỗi 8 giờ)
- Quy trình:
  1. Tìm các shows sẽ chiếu trong 8 giờ tới
  2. Lấy danh sách users đã đặt vé (từ `occupiedSeats`)
  3. Gửi email nhắc nhở cho mỗi user

**Lưu ý**: Code hiện tại có bug (dùng `windowStart` và `showTime` chưa được định nghĩa, nên function này có thể không chạy đúng)

### 5. **Gửi thông báo phim mới**
**Function: `send-new-show-notifications`**
- Trigger: Event `app/show.added`
- Quy trình:
  1. Lấy danh sách tất cả users
  2. Gửi email thông báo phim mới cho mỗi user

**Khi nào trigger:**
- Khi admin thêm show mới

---

## 📧 HỆ THỐNG EMAIL (BREVO)

### Cấu hình:
- **Service**: Brevo (tên cũ: Sendinblue)
- **Method**: HTTP API (không dùng SMTP vì Railway Free chặn outbound SMTP)
- **Endpoint**: `https://api.brevo.com/v3/smtp/email`
- **Authentication**: API Key trong header `api-key`

### Các loại email được gửi:
1. **Email xác nhận đặt vé**: Gửi sau khi thanh toán thành công
2. **Email nhắc nhở**: Gửi 8 giờ trước khi phim chiếu (cron job)
3. **Email thông báo phim mới**: Gửi cho tất cả users khi admin thêm show mới

### Biến môi trường cần thiết:
- `BREVO_API_KEY`: API v3 key từ Brevo
- `SENDER_EMAIL`: Email đã được verify trong Brevo

---

## 🎯 FLOW CHÍNH CỦA HỆ THỐNG

### Flow đặt vé và thanh toán:
```
1. User chọn phim → Xem chi tiết → Chọn ngày/giờ → Chọn ghế
2. Click "Thanh toán" 
   → Backend tạo Booking (ispaid: false) + Chiếm giữ ghế
   → Tạo Stripe Checkout Session
   → Trigger Inngest event "app/checkpayment" (để check sau 10 phút)
3. User thanh toán trên Stripe
4. Stripe webhook → Update booking (ispaid: true)
   → Trigger Inngest event "app/show.booked"
5. Inngest gửi email xác nhận đến user
```

### Flow tự động hủy booking chưa thanh toán:
```
1. Booking được tạo với ispaid: false
2. Inngest event "app/checkpayment" được trigger
3. Sau 10 phút, Inngest kiểm tra:
   - Nếu ispaid vẫn là false → Giải phóng ghế + Xóa booking
   - Nếu đã ispaid: true → Không làm gì (user đã thanh toán)
```

### Flow thêm show mới (Admin):
```
1. Admin chọn phim từ TMDB → Nhập giá + Ngày giờ chiếu
2. Backend:
   - Tạo Movie record (nếu chưa có)
   - Tạo các Show records
   - Trigger Inngest event "app/show.added"
3. Inngest gửi email thông báo phim mới cho tất cả users
```

---

## 🔒 BẢO MẬT VÀ XÁC THỰC

### API Authentication:
- Sử dụng Clerk JWT token trong header: `Authorization: Bearer <token>`
- Frontend lấy token qua `getToken()` từ Clerk SDK

### Admin Routes Protection:
- Tất cả routes `/api/admin/*` đều có middleware `protectAdmin`
- Kiểm tra `user.privateMetadata.role === 'admin'`

### Stripe Webhook Security:
- Verify webhook signature với `STRIPE_WEBHOOK_SECRET`
- Xử lý raw body (không parse JSON) để verify signature

---

## 🌐 INTEGRATION VỚI DỊCH VỤ BÊN NGOÀI

### 1. **TMDB (The Movie Database)**
- **Mục đích**: Lấy thông tin phim, poster, casts, genres
- **APIs sử dụng**:
  - `GET /movie/now_playing`: Danh sách phim đang chiếu
  - `GET /movie/{id}`: Chi tiết phim
  - `GET /movie/{id}/credits`: Danh sách diễn viên
- **Authentication**: Bearer token trong header

### 2. **Clerk**
- **Mục đích**: Authentication & User management
- **Features**: 
  - Login/Register
  - Session management
  - User metadata (favorites, role)
- **Webhooks**: Gửi events về Inngest để đồng bộ user data

### 3. **Stripe**
- **Mục đích**: Thanh toán online
- **Features**: Checkout session, webhook events

### 4. **Inngest**
- **Mục đích**: Background jobs, scheduled tasks, event-driven workflows
- **Deployment**: Functions được serve tại `/api/inngest`

### 5. **Brevo**
- **Mục đích**: Gửi transactional emails
- **Method**: HTTP API (REST)

---

## 📝 GHI CHÚ QUAN TRỌNG

### Bugs/Todo trong code hiện tại:
1. **Function `sendShowReminders`**: 
   - Sử dụng biến `windowStart` chưa được định nghĩa
   - Field `showTime` không tồn tại trong Show model (nên dùng `showDateTime`)

2. **MyBookings component**: 
   - Typo: `item.bookedSeats.lenght` → nên là `length`

### Điểm cần cải thiện:
1. Error handling có thể tốt hơn
2. Validation input data
3. Rate limiting cho APIs
4. Logging và monitoring
5. Unit tests và integration tests

---

## 🚀 DEPLOYMENT

### Backend (Railway):
- Environment variables cần thiết:
  - Database: MongoDB connection string
  - Clerk: API keys
  - Stripe: Secret key, Webhook secret
  - Inngest: Signing key
  - Brevo: API key, Sender email
  - TMDB: API key

### Frontend (Vercel):
- Environment variables:
  - `VITE_BASE_URL`: Backend API URL
  - `VITE_TMDB_IMAGE_BASE_URL`: TMDB image base URL
  - `VITE_CURRENCY`: Currency symbol (ví dụ: "$")
  - Clerk public key

### Inngest:
- Inngest functions được serve tại backend endpoint `/api/inngest`
- Inngest Cloud cần được cấu hình để gọi về endpoint này

---

**Tài liệu này mô tả đầy đủ các chức năng và nghiệp vụ của hệ thống đặt vé xem phim.**

