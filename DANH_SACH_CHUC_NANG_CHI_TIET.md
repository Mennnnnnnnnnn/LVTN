# 📋 DANH SÁCH CHỨC NĂNG HỆ THỐNG ĐẶT VÉ XEM PHIM

## 🎯 TỔNG QUAN
Hệ thống có tổng cộng **47 chức năng chính** được phân chia thành các nhóm sau:

---

## 👤 **NHÓM CHỨC NĂNG NGƯỜI DÙNG (USER) - 15 chức năng**

### 1. **Xác thực và Quản lý Tài khoản**
1. ✅ **Đăng ký tài khoản** (Clerk Authentication)
2. ✅ **Đăng nhập** (Clerk Authentication)
3. ✅ **Đăng xuất** (Clerk Authentication)
4. ✅ **Đồng bộ thông tin user từ Clerk** (Inngest: `sync-user-from-clerk`)
5. ✅ **Cập nhật thông tin user** (Inngest: `update-user-from-clerk`)
6. ✅ **Xóa tài khoản** (Inngest: `delete-user-with-clerk`)

### 2. **Xem Phim**
7. ✅ **Xem trang chủ** (Home page với Hero, Featured movies, Trailers)
8. ✅ **Xem danh sách phim đang chiếu** (`GET /api/show/all`)
9. ✅ **Xem danh sách phim sắp chiếu** (`GET /api/show/upcoming`)
10. ✅ **Xem chi tiết phim** (`GET /api/show/:movieId`)
   - Thông tin phim (poster, title, overview, genres, casts, rating)
   - Lịch chiếu theo ngày và giờ
   - Trailer phim
11. ✅ **Xem trailer phim** (Modal hiển thị YouTube trailer)

### 3. **Yêu thích Phim**
12. ✅ **Thêm phim vào yêu thích** (`POST /api/user/update-favorite`)
13. ✅ **Xóa phim khỏi yêu thích** (`POST /api/user/update-favorite`)
14. ✅ **Xem danh sách phim yêu thích** (`GET /api/user/favorites`)

### 4. **Đặt Vé**
15. ✅ **Xem sơ đồ ghế** (`GET /api/booking/seats/:showId`)
   - Hiển thị ghế đã đặt (disabled)
   - Hiển thị ghế còn trống
   - Hiển thị ghế hỏng (broken seats)
   - Hiển thị ghế đôi (couple seats)
16. ✅ **Chọn ghế ngồi** (Frontend validation)
   - Tối đa 5 ghế
   - Không để trống 1 ghế đơn (ràng buộc ghế)
   - Tự động chọn 2 ghế liền kề cho ghế đôi
17. ✅ **Tạo booking** (`POST /api/booking/create`)
   - Kiểm tra ghế còn trống
   - Tính giá vé (base × multiplier + phụ thu ghế đôi + phụ thu suất tối)
   - Chiếm giữ ghế ngay lập tức
   - Tạo Stripe Checkout Session
   - Trigger Inngest check payment sau 10 phút
18. ✅ **Thanh toán online** (Stripe Checkout)
   - Redirect đến Stripe
   - Thanh toán bằng thẻ tín dụng/debit
   - Thời hạn thanh toán: 30 phút
19. ✅ **Hủy vé** (`POST /api/booking/cancel/:bookingId`)
   - Hủy vé chưa thanh toán (xóa booking)
   - Hủy vé đã thanh toán (tính hoàn tiền theo chính sách)
   - Chính sách hoàn tiền:
     - Trước 24h: Hoàn 80%
     - Trước 12-24h: Hoàn 50%
     - Trước 6-12h: Hoàn 20%
     - Dưới 6h: Không hoàn
   - Gửi email xác nhận hủy vé

### 5. **Quản lý Booking**
20. ✅ **Xem lịch sử đặt vé** (`GET /api/user/bookings`)
   - Danh sách tất cả bookings (đã thanh toán và chưa thanh toán)
   - Thông tin phim, suất chiếu, ghế ngồi, số tiền
   - Link thanh toán lại cho vé chưa thanh toán

### 6. **Thông tin Hệ thống**
21. ✅ **Xem trang Giới thiệu** (About page)
22. ✅ **Xem Hướng dẫn đặt vé** (BookingGuide page)
23. ✅ **Xem Câu hỏi thường gặp** (FAQ page)
24. ✅ **Xem Chính sách bảo mật** (PrivacyPolicy page)
25. ✅ **Xem Chính sách hoàn tiền** (RefundPolicy page)
26. ✅ **Xem Điều khoản dịch vụ** (TermsOfService page)

---

## 👨‍💼 **NHÓM CHỨC NĂNG QUẢN TRỊ VIÊN (ADMIN) - 18 chức năng**

### 1. **Xác thực Admin**
27. ✅ **Kiểm tra quyền admin** (`GET /api/admin/is-admin`)
   - Middleware `protectAdmin` kiểm tra role trong Clerk

### 2. **Dashboard**
28. ✅ **Xem Dashboard tổng quan** (`GET /api/admin/dashboard`)
   - Tổng số bookings đã thanh toán
   - Tổng doanh thu
   - Số suất chiếu đang hoạt động
   - Tổng số người dùng
   - Danh sách shows đang hoạt động

### 3. **Quản lý Phim và Suất chiếu**
29. ✅ **Lấy danh sách phim đang chiếu từ TMDB** (`GET /api/show/now-playing`)
   - Fetch từ TMDB API với runtime và genres
30. ✅ **Thêm suất chiếu mới** (`POST /api/show/add`)
   - Chọn phim từ TMDB
   - Chọn phòng chiếu
   - Nhập giá vé cơ bản
   - Thêm nhiều ngày-giờ chiếu
   - Tự động fetch thông tin phim từ TMDB nếu chưa có
   - Kiểm tra xung đột lịch chiếu (conflict detection)
   - Validation: Ngày show phải >= ngày khởi chiếu phim
   - Trigger email thông báo phim mới (nếu là phim mới)
31. ✅ **Xem danh sách tất cả suất chiếu** (`GET /api/admin/all-shows`)
   - Thông tin: Tên phim, thời gian chiếu, phòng chiếu, số ghế đã đặt, doanh thu
32. ✅ **Cập nhật trailer cho tất cả phim** (`POST /api/admin/update-trailers`)
   - Fetch trailer từ TMDB và cập nhật vào database

### 4. **Quản lý Booking**
33. ✅ **Xem danh sách tất cả bookings** (`GET /api/admin/all-bookings`)
   - Thông tin: User, phim, suất chiếu, ghế ngồi, số tiền, trạng thái

### 5. **Quản lý Người dùng**
34. ✅ **Xem danh sách tất cả users** (`GET /api/admin/all-users`)
   - Thông tin user và danh sách phim yêu thích

### 6. **Quản lý Phòng chiếu (Cinema Hall)**
35. ✅ **Xem danh sách tất cả phòng chiếu** (`GET /api/hall/all`)
   - Filter theo status (active/maintenance/inactive)
   - Filter theo type (Standard/VIP/IMAX)
36. ✅ **Xem chi tiết phòng chiếu** (`GET /api/hall/:hallId`)
37. ✅ **Tạo phòng chiếu mới** (`POST /api/hall/create`)
   - Tên phòng, số phòng, loại phòng
   - Sơ đồ ghế (rows, seatsPerRow, coupleSeatsRows)
   - Hệ số giá (priceMultiplier)
   - Trạng thái (active/maintenance/inactive)
   - Ghế hỏng (brokenSeats)
38. ✅ **Cập nhật phòng chiếu** (`PUT /api/hall/:hallId`)
   - Cập nhật tất cả thông tin phòng chiếu
39. ✅ **Xóa/Vô hiệu hóa phòng chiếu** (`DELETE /api/hall/:hallId`)
   - Soft delete (chuyển sang inactive)
   - Kiểm tra có suất chiếu tương lai không
40. ✅ **Chuyển đổi trạng thái phòng** (`PATCH /api/hall/:hallId/status`)
   - Chuyển giữa active/maintenance/inactive
   - Thêm ghi chú bảo trì (maintenanceNote)
   - Thêm ngày bắt đầu/kết thúc bảo trì
41. ✅ **Xem thống kê phòng chiếu** (`GET /api/hall/:hallId/statistics`)
   - Tổng số suất chiếu
   - Tổng doanh thu
   - Số ghế đã đặt
   - Tỷ lệ lấp đầy (occupancy rate)
   - Doanh thu trung bình mỗi suất
   - Filter theo khoảng thời gian
42. ✅ **Xem thống kê tất cả phòng chiếu** (`GET /api/hall/statistics/all`)
   - Tổng hợp thống kê của tất cả phòng

### 7. **Giao diện Admin**
43. ✅ **Trang Admin Dashboard** (Dashboard.jsx)
44. ✅ **Trang Thêm suất chiếu** (AddShows.jsx)
45. ✅ **Trang Danh sách suất chiếu** (ListShows.jsx)
46. ✅ **Trang Danh sách bookings** (ListBookings.jsx)
47. ✅ **Trang Danh sách users** (ListUsers.jsx)
48. ✅ **Trang Quản lý phòng chiếu** (ListCinemaHalls.jsx)

---

## 🔄 **NHÓM CHỨC NĂNG HỆ THỐNG (BACKGROUND JOBS) - 6 chức năng**

### 1. **Đồng bộ User**
49. ✅ **Đồng bộ user mới từ Clerk** (Inngest: `sync-user-from-clerk`)
   - Trigger: Event `clerk/user.created`
   - Tạo user trong MongoDB
50. ✅ **Cập nhật user từ Clerk** (Inngest: `update-user-from-clerk`)
   - Trigger: Event `clerk/user.updated`
   - Cập nhật thông tin user trong MongoDB
51. ✅ **Xóa user từ Clerk** (Inngest: `delete-user-with-clerk`)
   - Trigger: Event `clerk/user.deleted`
   - Xóa user khỏi MongoDB

### 2. **Tự động hóa Booking**
52. ✅ **Tự động hủy booking chưa thanh toán** (Inngest: `release-seats-delete-booking`)
   - Trigger: Event `app/checkpayment`
   - Đợi 10 phút sau khi booking được tạo
   - Kiểm tra `ispaid`
   - Nếu chưa thanh toán: Giải phóng ghế + Xóa booking

### 3. **Gửi Email**
53. ✅ **Gửi email xác nhận đặt vé** (Inngest: `send-booking-confirmation-email`)
   - Trigger: Event `app/show.booked` (từ Stripe webhook)
   - Tạo QR code chứa thông tin booking
   - Gửi email với QR code đính kèm
   - Thông tin: Phim, suất chiếu, ghế ngồi, tổng tiền
54. ✅ **Gửi email nhắc nhở trước khi chiếu** (Inngest: `send-show-reminders`)
   - Trigger: Cron job mỗi 1 giờ
   - Tìm shows sẽ chiếu trong 3 giờ tới
   - Gửi email nhắc nhở cho users đã đặt vé
55. ✅ **Gửi email thông báo phim mới** (Inngest: `send-new-show-notifications`)
   - Trigger: Event `app/show.added`
   - Gửi email cho tất cả users khi admin thêm phim mới
   - Gửi theo batch (50 users/batch)
56. ✅ **Gửi email xác nhận hủy vé** (Inngest: `send-cancellation-email`)
   - Trigger: Event `app/booking.cancelled`
   - Thông tin: Phim, suất chiếu, số tiền hoàn lại, chính sách hoàn tiền

---

## 💳 **NHÓM CHỨC NĂNG THANH TOÁN (STRIPE) - 2 chức năng**

### 1. **Xử lý Webhook**
57. ✅ **Xử lý Stripe webhook** (`POST /api/booking/stripe-webhook`)
   - Verify webhook signature
   - Xử lý event `payment_intent.succeeded`
   - Cập nhật booking: `ispaid = true`
   - Trigger Inngest gửi email xác nhận

### 2. **Thanh toán**
58. ✅ **Tạo Stripe Checkout Session**
   - Metadata: bookingId
   - Success URL: `/loading/my-bookings`
   - Cancel URL: `/my-bookings`
   - Expires: 30 phút

---

## 🎨 **NHÓM CHỨC NĂNG GIAO DIỆN (UI/UX) - 6 chức năng**

### 1. **Components**
59. ✅ **Navbar** - Header với auth buttons, navigation
60. ✅ **Footer** - Footer thông tin
61. ✅ **Loading** - Loading spinner
62. ✅ **MovieCard** - Card hiển thị phim
63. ✅ **TrailerModal** - Modal hiển thị trailer YouTube
64. ✅ **DateSelect** - Component chọn ngày
65. ✅ **SeatLayoutDesigner** - Designer sơ đồ ghế (Admin)

### 2. **Admin Components**
66. ✅ **AdminNavbar** - Header admin
67. ✅ **AdminSidebar** - Sidebar navigation admin
68. ✅ **Title** - Page title component

---

## 📊 **TỔNG KẾT**

### Phân loại theo Module:
- **User Module**: 26 chức năng
- **Admin Module**: 18 chức năng
- **System/Background Jobs**: 6 chức năng
- **Payment Module**: 2 chức năng
- **UI/UX Components**: 10 chức năng

### Phân loại theo Loại:
- **API Endpoints**: 28 endpoints
- **Background Jobs (Inngest)**: 8 functions
- **Frontend Pages**: 18 pages
- **UI Components**: 10 components
- **Webhooks**: 1 webhook handler

### Tổng số: **70 chức năng** (bao gồm cả UI components và background jobs)

---

## 🔍 **CHI TIẾT CÁC CHỨC NĂNG ĐẶC BIỆT**

### 1. **Conflict Detection (Phát hiện xung đột lịch chiếu)**
- Tính thời gian kết thúc: `runtime + 10 phút buffer + 20 phút vệ sinh`
- Kiểm tra 3 trường hợp xung đột:
  - Show mới bắt đầu khi show cũ đang chiếu
  - Show mới kết thúc khi show cũ đang chiếu
  - Show mới bọc hoàn toàn show cũ
- Kiểm tra xung đột trong cùng request (internal conflict)

### 2. **Seat Validation (Ràng buộc ghế)**
- Không để trống 1 ghế bên trái
- Không để trống 1 ghế bên phải
- Không để trống 1 ghế ở giữa
- Tối đa 5 ghế mỗi booking
- Ghế đôi: Click 1 ghế → Tự chọn 2 ghế liền kề

### 3. **Price Calculation (Tính giá vé)**
- Giá base × priceMultiplier (theo loại phòng)
- Phụ thu ghế đôi: +10.000₫/ghế
- Phụ thu suất tối (>= 17h): +10.000₫/ghế

### 4. **Refund Policy (Chính sách hoàn tiền)**
- Trước 24h: Hoàn 80%
- Trước 12-24h: Hoàn 50%
- Trước 6-12h: Hoàn 20%
- Dưới 6h: Không hoàn

### 5. **QR Code Generation**
- Tạo QR code chứa JSON: `{bookingId, userId, showId, seats}`
- Đính kèm trong email xác nhận
- Format: PNG, 250x250px

---

*Tài liệu này liệt kê đầy đủ tất cả các chức năng được implement trong hệ thống đặt vé xem phim.*

