# GIẢI THÍCH: CÁC TÁC VỤ BẤT ĐỒNG BỘ (Background Jobs)

## 🔄 TÁC VỤ BẤT ĐỒNG BỘ LÀ GÌ?

**Tác vụ bất đồng bộ (Background Jobs)** là những công việc được thực hiện "ngầm" trong hệ thống, không cần người dùng phải chờ đợi. Thay vì xử lý ngay lập tức và làm chậm phản hồi, hệ thống sẽ "xếp hàng" các tác vụ này lại và xử lý sau.

### Ví dụ thực tế:
- ❌ **Đồng bộ (Synchronous)**: Khi bạn đặt vé → Hệ thống đợi gửi email xong rồi mới báo "Đặt vé thành công" (chậm, mất thời gian)
- ✅ **Bất đồng bộ (Asynchronous)**: Khi bạn đặt vé → Hệ thống ngay lập tức báo "Đặt vé thành công" → Email sẽ được gửi ở background (nhanh, mượt mà)

---

## 📋 CÁC TÁC VỤ BẤT ĐỒNG BỘ TRONG HỆ THỐNG

Trong dự án của bạn, các tác vụ bất đồng bộ được xử lý bằng **Inngest** (một công cụ quản lý background jobs). Có 8 tác vụ chính:

### 1. **Đồng bộ User từ Clerk** (3 functions)
- **Tạo user mới**: Khi người dùng đăng ký trên Clerk → Tự động tạo user trong MongoDB
- **Cập nhật user**: Khi user cập nhật thông tin trên Clerk → Tự động cập nhật trong MongoDB  
- **Xóa user**: Khi user bị xóa trên Clerk → Tự động xóa khỏi MongoDB

**Lý do**: Giữ dữ liệu đồng bộ giữa Clerk (authentication) và MongoDB (database)

---

### 2. **Tự động hủy booking chưa thanh toán** ⏰
- **Khi nào**: Sau khi user đặt vé nhưng chưa thanh toán
- **Quy trình**:
  1. User đặt vé → Booking được tạo với `ispaid = false`
  2. Hệ thống đợi 10 phút
  3. Sau 10 phút, kiểm tra: Nếu vẫn chưa thanh toán
  4. → Giải phóng ghế ngồi (trả lại ghế cho người khác đặt)
  5. → Xóa booking khỏi database

**Lý do**: Tránh tình trạng user đặt vé nhưng không thanh toán, làm "treo" ghế và người khác không đặt được

---

### 3. **Gửi email xác nhận đặt vé** 📧
- **Khi nào**: Sau khi user thanh toán thành công
- **Quy trình**:
  1. Stripe webhook báo thanh toán thành công
  2. Hệ thống cập nhật `ispaid = true`
  3. Trigger Inngest function
  4. Tạo QR code từ thông tin booking
  5. Gửi email xác nhận với QR code đính kèm

**Lý do**: User cần email xác nhận và QR code để check-in tại rạp, nhưng không cần chờ email này mới xem được kết quả

---

### 4. **Gửi email nhắc nhở lịch chiếu** 🔔
- **Khi nào**: Chạy mỗi giờ (cron job), kiểm tra các suất chiếu sắp diễn ra
- **Quy trình**:
  1. Tìm các suất chiếu sẽ bắt đầu trong **3 giờ tới**
  2. Lấy danh sách user đã đặt vé
  3. Gửi email nhắc nhở cho từng user

**Lý do**: Nhắc user nhớ lịch chiếu, tránh bỏ lỡ

---

### 5. **Gửi email thông báo phim mới** 🎬
- **Khi nào**: Khi admin thêm suất chiếu mới
- **Quy trình**:
  1. Admin thêm suất chiếu mới
  2. Trigger Inngest function
  3. Lấy danh sách tất cả users
  4. Gửi email thông báo phim mới cho tất cả users (theo batch 50 người/lần)

**Lý do**: Quảng bá phim mới đến tất cả khách hàng, nhưng không làm chậm quá trình admin thêm suất chiếu

---

### 6. **Gửi email xác nhận hủy vé** 🎫
- **Khi nào**: Khi user hủy vé thành công
- **Quy trình**:
  1. User hủy vé
  2. Hệ thống tính toán số tiền hoàn lại
  3. Giải phóng ghế
  4. Trigger Inngest function
  5. Gửi email xác nhận hủy vé với thông tin hoàn tiền

**Lý do**: User cần email xác nhận hủy vé và thông tin hoàn tiền

---

## 💡 TẠI SAO CẦN TÁC VỤ BẤT ĐỒNG BỘ?

### Lợi ích:
1. **Tăng tốc độ phản hồi**: User không phải chờ các tác vụ tốn thời gian (gửi email, xử lý dữ liệu)
2. **Xử lý lỗi tốt hơn**: Nếu gửi email lỗi, không ảnh hưởng đến quá trình đặt vé
3. **Chạy theo lịch**: Có thể chạy các tác vụ theo thời gian (như nhắc nhở mỗi giờ)
4. **Xử lý hàng loạt**: Gửi email cho nhiều người mà không làm quá tải server
5. **Retry tự động**: Nếu lỗi, hệ thống tự động thử lại

### Ví dụ so sánh:

**KHÔNG dùng bất đồng bộ**:
```
User đặt vé → Đợi tạo booking → Đợi gửi email (5 giây) → Đợi tạo QR code (2 giây) 
→ Mới báo "Thành công" → Tổng: 7 giây ⏱️ (chậm!)
```

**CÓ dùng bất đồng bộ**:
```
User đặt vé → Tạo booking → Báo "Thành công" ngay (0.5 giây) ⚡
→ Email và QR code được xử lý ở background (không cần đợi)
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

- **Inngest**: Công cụ quản lý background jobs
- **Brevo/Nodemailer**: Gửi email
- **QRCode library**: Tạo QR code
- **Cron jobs**: Chạy tác vụ theo lịch (ví dụ: mỗi giờ)

---

## 📝 TÓM TẮT

**Các tác vụ bất đồng bộ** = Những công việc chạy "ngầm" trong hệ thống, giúp:
- ✅ Tăng tốc độ phản hồi
- ✅ Gửi email, tạo QR code
- ✅ Tự động hóa các quy trình (hủy vé, nhắc nhở)
- ✅ Đồng bộ dữ liệu giữa các hệ thống

Trong dự án của bạn có **8 tác vụ bất đồng bộ** chính, tất cả đều được xử lý bằng **Inngest** để đảm bảo hệ thống hoạt động mượt mà và hiệu quả!





