# HỆ THỐNG ĐẶT VÉ XEM PHIM QUICKSHOW

## 1. MỤC TIÊU

### 1.1. Mục tiêu chung
Xây dựng hệ thống đặt vé xem phim trực tuyến QuickShow, số hóa quy trình đặt vé và tối ưu trải nghiệm người dùng.

### 1.2. Mục tiêu cụ thể
- Cho phép người dùng đặt vé online 24/7
- Tích hợp thanh toán trực tuyến an toàn qua Stripe
- Tự động gửi email xác nhận và nhắc nhở
- Quản lý ghế ngồi realtime, tránh đặt trùng
- Cung cấp thông tin phim phong phú từ TMDB
- Cung cấp công cụ quản trị toàn diện cho admin

---

## 2. PHẠM VI

### 2.1. Trong phạm vi dự án

**Người dùng:**
- Xem danh sách phim đang chiếu
- Xem chi tiết phim, lịch chiếu, diễn viên
- Đặt vé với sơ đồ ghế trực quan (tối đa 5 ghế)
- Thanh toán trực tuyến qua Stripe
- Xem lịch sử đặt vé
- Quản lý danh sách phim yêu thích
- Nhận email xác nhận và nhắc nhở

**Admin:**
- Dashboard thống kê (bookings, doanh thu, users)
- Thêm suất chiếu từ danh sách phim TMDB
- Xem và quản lý tất cả suất chiếu
- Xem và quản lý tất cả booking

**Hệ thống:**
- Tự động đồng bộ users từ Clerk
- Tự động hủy booking chưa thanh toán sau 10 phút
- Tự động giải phóng ghế khi booking bị hủy
- Xử lý webhook từ Stripe
- Background jobs với Inngest

### 2.2. Giới hạn hiện tại
- **1 phòng chiếu duy nhất** (90 ghế: 10 hàng x 9 ghế)
- Sơ đồ ghế cố định, không thể thay đổi
- Không phân loại ghế (tất cả ghế cùng giá)
- Không quản lý đồ ăn/combo
- Không có chương trình khuyến mãi/voucher
- Không có tính năng review/rating phim

### 2.3. Ngoài phạm vi
- Quản lý nhiều rạp/chi nhánh
- Quản lý nhiều phòng chiếu
- Sơ đồ ghế linh hoạt/tùy chỉnh
- Mobile app (iOS/Android)
- Thanh toán offline tại quầy
- QR code check-in
- A/B testing và phân tích hành vi người dùng

---

## 3. ĐỐI TƯỢNG SỬ DỤNG

### 3.1. Người dùng cuối (End Users)
- **Đặc điểm:** Khách hàng từ 16-45 tuổi, quen thuộc với công nghệ
- **Nhu cầu:** Đặt vé online thuận tiện, chọn ghế yêu thích, thanh toán nhanh
- **Quyền hạn:** Xem phim, đặt vé, thanh toán, xem lịch sử booking, quản lý yêu thích

### 3.2. Quản trị viên (Admin)
- **Đặc điểm:** Nhân viên quản lý rạp phim
- **Nhu cầu:** Quản lý suất chiếu, xem thống kê, theo dõi đặt vé
- **Quyền hạn:** Tất cả quyền của User + quản lý shows, bookings, xem dashboard

### 3.3. Hệ thống
- Đồng bộ dữ liệu từ Clerk
- Tự động hủy booking chưa thanh toán
- Gửi email tự động (xác nhận, nhắc nhở, thông báo)
- Scheduled tasks (cron jobs)

---

## 4. TỔNG QUAN HỆ THỐNG

### 4.1. Kiến trúc
- **Frontend:** React + Vite + Tailwind CSS (Vercel)
- **Backend:** Node.js + Express (Railway)
- **Database:** MongoDB Atlas
- **Authentication:** Clerk
- **Payment:** Stripe
- **Background Jobs:** Inngest
- **Email:** Brevo
- **Movie Data:** TMDB API

### 4.2. Mô hình dữ liệu chính
- **User:** _id, name, email, image
- **Movie:** _id, title, overview, poster, genres, casts, rating, runtime
- **Show:** movie, showDateTime, showPrice, occupiedSeats
- **Booking:** user, show, amount, bookedSeats, ispaid, paymentLink

### 4.3. Đặc điểm kỹ thuật
- Kiến trúc Fullstack (Client-Server)
- RESTful API
- JWT Authentication
- Event-driven workflows (Inngest)
- Webhook integration (Stripe, Clerk)
- Real-time seat management

---

## 5. CHỨC NĂNG CHÍNH

### 5.1. Xác thực và Phân quyền
- Đăng ký, đăng nhập, đăng xuất
- Phân quyền User/Admin
- Quản lý session với JWT

### 5.2. Quản lý Phim
- Xem danh sách phim đang chiếu
- Xem chi tiết phim (poster, overview, genres, casts, rating)
- Thêm/xóa phim yêu thích
- Xem lịch chiếu theo ngày và giờ

### 5.3. Đặt vé
- Chọn ngày và giờ chiếu
- Xem sơ đồ ghế 90 chỗ (10 hàng x 9 ghế)
- Chọn ghế (tối đa 5 ghế)
- Ràng buộc: Không để trống đúng 1 ghế đơn
- Tự động kiểm tra ghế còn trống

### 5.4. Thanh toán
- Tạo Stripe Checkout Session (timeout 30 phút)
- Redirect đến trang thanh toán Stripe
- Xử lý webhook từ Stripe
- Cập nhật trạng thái booking
- Gửi email xác nhận

### 5.5. Quản lý Booking
- Xem lịch sử đặt vé (paid và unpaid)
- Xem chi tiết: phim, giờ chiếu, ghế, giá
- Thanh toán lại cho booking chưa thanh toán

### 5.6. Admin Panel
- **Dashboard:** Tổng bookings, doanh thu, shows hoạt động, tổng users
- **Quản lý Suất chiếu:** Thêm show từ TMDB, xem danh sách shows
- **Quản lý Booking:** Xem tất cả bookings, thông tin chi tiết

---

## 6. CHỨC NĂNG MỞ RỘNG

### 6.1. Ưu tiên cao
- Quản lý nhiều phòng chiếu với sơ đồ ghế khác nhau
- Phân loại ghế (VIP, thường, đôi) với giá linh hoạt
- Hệ thống mã giảm giá và voucher

### 6.2. Ưu tiên trung bình
- Đặt combo đồ ăn (bỏng ngô, nước ngọt)
- Review và rating phim
- Quản lý nhiều rạp/chi nhánh
- Chương trình thành viên (tích điểm, đổi thưởng)

### 6.3. Ưu tiên thấp
- Mobile App (iOS/Android)
- Social features (share, invite bạn bè)
- AI Recommendation (gợi ý phim dựa trên sở thích)

---

## 7. BÁO CÁO VÀ DASHBOARD

### 7.1. Dashboard hiện có
- Tổng số Bookings (đã thanh toán)
- Tổng Doanh thu (USD)
- Shows đang hoạt động
- Tổng số Users

### 7.2. Báo cáo đề xuất
- **Doanh thu:** Theo ngày/tuần/tháng, theo phim, xu hướng
- **Đặt vé:** Số booking theo thời gian, tỷ lệ chuyển đổi, tỷ lệ hủy
- **Phòng chiếu:** Tỷ lệ lấp đầy ghế, khung giờ hot
- **Người dùng:** User mới, user hoạt động, chi tiêu trung bình

---

## 8. QUY TRÌNH NGHIỆP VỤ

### 8.1. Quy trình Đặt vé
1. User đăng nhập và xem danh sách phim
2. Chọn phim → Xem chi tiết
3. Chọn ngày và giờ chiếu
4. Chuyển đến trang chọn ghế
5. Xem ghế đã đặt, chọn ghế mong muốn (tối đa 5)
6. Kiểm tra ràng buộc ghế (không để trống 1 ghế)
7. Click "Thanh toán"
8. Hệ thống tạo booking và chiếm ghế
9. Redirect đến Stripe để thanh toán
10. Sau thanh toán thành công: Cập nhật booking, gửi email xác nhận

### 8.2. Quy trình Tự động hủy
1. Booking được tạo với ispaid = false
2. Inngest trigger event "checkpayment"
3. Đợi 10 phút
4. Kiểm tra trạng thái thanh toán
5. Nếu vẫn chưa thanh toán → Giải phóng ghế + Xóa booking

### 8.3. Quy trình Admin thêm Show
1. Admin đăng nhập và truy cập Admin Panel
2. Click "Thêm Chương trình"
3. Xem danh sách phim từ TMDB
4. Chọn phim, nhập giá vé
5. Thêm nhiều ngày-giờ chiếu
6. Submit → Hệ thống tạo Movie (nếu chưa có) và các Show
7. Gửi email thông báo phim mới cho tất cả users

---

## 9. YÊU CẦU PHI CHỨC NĂNG

### 9.1. Hiệu năng
- Thời gian tải trang: < 2 giây
- API response time: < 500ms
- Hỗ trợ 100+ users đồng thời

### 9.2. Bảo mật
- JWT Authentication với Clerk
- HTTPS bắt buộc (production)
- PCI-DSS compliant qua Stripe
- Webhook signature verification
- Input validation và sanitization

### 9.3. Độ tin cậy
- Uptime target: 99.5%
- Kiểm tra double-booking
- Auto-cleanup booking chưa thanh toán
- Error handling và logging

### 9.4. Khả năng mở rộng
- Stateless backend (có thể deploy nhiều instances)
- Database indexing cho query thường dùng
- Background jobs tự động scale

### 9.5. Khả năng sử dụng
- Responsive design (mobile, tablet, desktop)
- Giao diện đẹp, modern với Tailwind CSS
- Toast notifications cho mọi action
- Loading states rõ ràng

### 9.6. Khả năng bảo trì
- Clean code, readable
- Documentation đầy đủ
- Separation of concerns (MVC pattern)

### 9.7. Tương thích
- Browser: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Device: Mobile (375px+), Tablet (768px+), Desktop (1024px+)

---

## 10. TIÊU CHÍ ĐÁNH GIÁ

### 10.1. Điểm số theo khía cạnh

| Khía cạnh | Điểm | Ghi chú |
|-----------|------|---------|
| **Chức năng** | 10/10 | Đầy đủ features cốt lõi |
| **Kỹ thuật** | 8.4/10 | Kiến trúc tốt, cần thêm tests |
| **UX/UI** | 8.3/10 | Đẹp, responsive, cần cải thiện accessibility |
| **Nghiệp vụ** | 9.2/10 | Logic chặt chẽ, xử lý edge cases tốt |
| **Mở rộng** | 6.2/10 | Dễ extend, nhưng chưa có tests |
| **TỔNG** | **8.4/10** | **Tốt, sẵn sàng triển khai** |

### 10.2. Điểm mạnh
✅ Chức năng đầy đủ, đáp ứng yêu cầu  
✅ Giao diện đẹp, UX mượt mà  
✅ Tích hợp tốt với các dịch vụ bên thứ ba  
✅ Background jobs tự động hóa hiệu quả  
✅ Code clean, dễ đọc, documentation đầy đủ  
✅ Bảo mật tốt với Clerk và Stripe  

### 10.3. Điểm cần cải thiện
⚠️ Chưa có unit tests và integration tests  
⚠️ Error handling có thể chi tiết hơn  
⚠️ Chưa có monitoring/logging system  
⚠️ Accessibility cần cải thiện  
⚠️ Giới hạn 1 phòng chiếu (không linh hoạt)  
⚠️ Chưa có analytics và báo cáo chi tiết  

### 10.4. Khuyến nghị

**Ngắn hạn (1-3 tháng):**
- Viết unit tests cho core functions
- Thêm error logging (Sentry)
- Implement rate limiting
- Cải thiện accessibility

**Trung hạn (3-6 tháng):**
- Thêm quản lý nhiều phòng chiếu
- Phân loại ghế và giá linh hoạt
- Hệ thống voucher/discount
- Advanced analytics dashboard

**Dài hạn (6-12 tháng):**
- Mobile app (React Native)
- Đặt combo đồ ăn
- Review và rating system
- Quản lý chuỗi rạp

---

## KẾT LUẬN

Hệ thống đặt vé xem phim QuickShow là một ứng dụng web fullstack hoàn chỉnh, đáp ứng tốt yêu cầu nghiệp vụ của một rạp phim quy mô nhỏ. Với điểm số **8.4/10**, dự án đã hoàn thành đầy đủ các chức năng cốt lõi:

- ✅ Quản lý phim và suất chiếu
- ✅ Đặt vé với sơ đồ ghế trực quan
- ✅ Thanh toán trực tuyến an toàn
- ✅ Tự động hóa quy trình nghiệp vụ
- ✅ Admin panel quản trị tập trung

Hệ thống có kiến trúc rõ ràng, code sạch và tài liệu đầy đủ, sẵn sàng để triển khai thương mại hoặc làm nền tảng phát triển thành hệ thống lớn hơn.

---

*Tài liệu tóm tắt dành cho LVTN | QuickShow © 2025*

