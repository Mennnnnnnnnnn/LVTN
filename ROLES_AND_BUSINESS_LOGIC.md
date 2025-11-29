# Phân Tích Role và Nghiệp Vụ - Hệ Thống Đặt Vé Xem Phim

## Tổng Quan Dự Án
Dự án là một **hệ thống đặt vé xem phim** với kiến trúc:
- **Frontend**: React (Vite) + Clerk Authentication
- **Backend**: Express.js + MongoDB + Mongoose
- **Authentication**: Clerk (sync với database qua Inngest)

---

## Số Lượng Role: **2 ROLE**

### 1. **ADMIN (Quản trị viên)**

#### Quyền truy cập:
- Routes: `/admin/*`

#### Chức năng nghiệp vụ:

##### 1.1. Trang Tổng Quan (`/admin`)
- **Hiển thị thống kê:**
  - Tổng số lượng đặt chỗ
  - Tổng doanh thu
  - Số chương trình đang hoạt động
  - Tổng số người dùng
- **Danh sách chương trình đang hoạt động:**
  - Hiển thị poster phim
  - Tên phim, giá vé
  - Đánh giá (vote_average)
  - Thời gian chiếu

##### 1.2. Thêm Chương Trình (`/admin/add-shows`)
- **Nghiệp vụ:**
  - Xem danh sách phim đang chiếu từ TMDB API
  - Chọn phim cần thêm suất chiếu
  - Nhập thông tin:
    - Ngày chiếu
    - Giờ chiếu (nhiều suất)
    - Giá vé
  - Lưu vào database:
    - Nếu phim chưa có trong DB → fetch từ TMDB và lưu
    - Tạo nhiều Show records (mỗi suất = 1 Show)

##### 1.3. Danh Sách Chương Trình (`/admin/list-shows`)
- **Xem tất cả suất chiếu:**
  - Tên phim
  - Thời gian chiếu (showDateTime)
  - Số lượng đặt chỗ (dựa trên occupiedSeats)
  - Doanh thu từ suất chiếu đó

##### 1.4. Danh Sách Đặt Chỗ (`/admin/list-bookings`)
- **Xem tất cả đơn đặt chỗ:**
  - Tên người dùng
  - Tên phim
  - Thời gian chiếu
  - Số ghế đã đặt
  - Số tiền

---

### 2. **USER (Người dùng thường)**

#### Quyền truy cập:
- Tất cả routes công khai (không phải `/admin/*`)

#### Chức năng nghiệp vụ:

##### 2.1. Trang Chủ (`/`)
- Xem danh sách phim đang chiếu
- Phim nổi bật
- Trailer
- Navigation

##### 2.2. Danh Sách Phim (`/movies`)
- Duyệt tất cả phim
- Xem poster, đánh giá, thông tin cơ bản

##### 2.3. Chi Tiết Phim (`/movies/:id`)
- **Hiển thị thông tin:**
  - Poster, backdrop
  - Tên phim, mô tả (overview)
  - Đánh giá (vote_average)
  - Thời lượng (runtime)
  - Thể loại (genres)
  - Năm phát hành
  - Danh sách diễn viên (casts)
- **Chức năng:**
  - Xem trailer
  - Chọn ngày chiếu (DateSelect component)
  - Thêm vào yêu thích
  - Đặt vé (navigate đến `/movies/:id/:date`)

##### 2.4. Chọn Ghế (`/movies/:id/:date`)
- **Nghiệp vụ đặt vé:**
  - Chọn suất chiếu (thời gian)
  - Chọn ghế ngồi:
    - Layout: 10 hàng (A-J), mỗi hàng 9 ghế
    - Tối đa 5 ghế cho 1 lần đặt
  - Xem màn hình (screen) để định hướng
- **Quy trình:**
  1. Chọn thời gian chiếu → validate
  2. Chọn ghế → validate (max 5 ghế)
  3. Click "Thanh toán" → navigate đến `/my-bookings`

##### 2.5. Vé Đặt Của Tôi (`/my-bookings`)
- **Xem đơn đặt chỗ:**
  - Poster phim
  - Tên phim, thời lượng
  - Ngày giờ chiếu
  - Số ghế đã đặt
  - Tổng số vé
  - Tổng tiền
- **Xử lý thanh toán:**
  - Nếu chưa thanh toán → hiển thị nút "Thanh toán ngay"
  - Trạng thái thanh toán (isPaid)

##### 2.6. Yêu Thích (`/favorite`)
- Lưu danh sách phim yêu thích
- Quản lý phim đã thích

---

## Cấu Trúc Dữ Liệu

### Models:

#### 1. **User Model**
```javascript
{
  _id: String (Clerk ID),
  name: String,
  email: String (unique),
  image: String
}
```
- **Lưu ý**: Chưa có trường `role`

#### 2. **Movie Model**
```javascript
{
  _id: String (TMDB ID),
  title: String,
  overview: String,
  poster_path: String,
  backdrop_path: String,
  release_date: String,
  original_language: String,
  tagline: String,
  genres: Array,
  casts: Array,
  vote_average: Number,
  runtime: Number,
  timestamps: true
}
```

#### 3. **Show Model**
```javascript
{
  movie: String (ref: Movie),
  showDateTime: Date,
  showPrice: Number,
  occupiedSeats: Object { // {seatId: userId}
    "A1": "user_123",
    "B2": "user_456"
  }
}
```

#### 4. **Booking** (chưa có model riêng)
- Có thể được lưu trong Show.occupiedSeats hoặc cần tạo model riêng

---

## Quy Trình Nghiệp Vụ Chính

### Quy trình Admin thêm suất chiếu:
1. Vào `/admin/add-shows`
2. Chọn phim từ danh sách phim đang chiếu (TMDB)
3. Nếu phim chưa có trong DB:
   - Fetch từ TMDB API (details + credits)
   - Lưu vào Movie collection
4. Nhập ngày, giờ, giá vé
5. Tạo nhiều Show records (mỗi giờ = 1 Show)
6. Lưu vào database

### Quy trình User đặt vé:
1. Duyệt phim → chọn phim
2. Xem chi tiết → chọn ngày chiếu
3. Chọn ghế:
   - Chọn suất chiếu (thời gian)
   - Chọn ghế (tối đa 5)
4. Click "Thanh toán"
5. Xem trong "Vé đặt của tôi"
6. Thanh toán (nếu chưa thanh toán)

---

## Vấn Đề Hiện Tại

### ⚠️ **THIẾU PHÂN QUYỀN**
1. **User model không có trường `role`**
   - Không thể phân biệt Admin vs User trong database
2. **Không có middleware bảo vệ admin routes**
   - Routes `/admin/*` không được bảo vệ
   - Bất kỳ ai biết URL đều có thể truy cập
3. **Chưa có authentication check**
   - Chưa check user đã đăng nhập chưa
   - Chưa check role của user

### 💡 **Đề Xuất Cải Thiện**
1. Thêm trường `role` vào User model (admin/user)
2. Tạo middleware kiểm tra quyền admin
3. Bảo vệ routes `/admin/*` với role check
4. Tạo model Booking riêng để quản lý đơn đặt chỗ tốt hơn

---

## Tổng Kết

- **Số role**: 2 (Admin, User)
- **Admin**: Quản lý phim, suất chiếu, xem đặt chỗ, thống kê
- **User**: Duyệt phim, đặt vé, xem vé đã đặt, yêu thích
- **Lưu ý**: Cần bổ sung phân quyền và bảo vệ routes

