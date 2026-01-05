# 💰 TÀI LIỆU PHẢN BIỆN: CHÍNH SÁCH HOÀN TIỀN

## 📋 MỤC LỤC
1. [Tổng quan nghiệp vụ](#1-tổng-quan-nghiệp-vụ)
2. [Chính sách hoàn tiền](#2-chính-sách-hoàn-tiền)
3. [Cấu trúc dữ liệu](#3-cấu-trúc-dữ-liệu)
4. [Luồng nghiệp vụ](#4-luồng-nghiệp-vụ)
5. [Code liên quan](#5-code-liên-quan)
6. [Câu hỏi thường gặp khi phản biện](#6-câu-hỏi-thường-gặp-khi-phản-biện)

---

## 1. TỔNG QUAN NGHIỆP VỤ

### 1.1. Mục đích
Hệ thống chính sách hoàn tiền cho phép:
- **Hủy vé linh hoạt**: User có thể hủy vé trước suất chiếu
- **Tính hoàn tiền tự động**: Dựa trên thời gian hủy so với giờ chiếu
- **Bảo vệ quyền lợi**: Hoàn tiền theo tỷ lệ công bằng
- **Email tự động**: Gửi email xác nhận hủy và thông tin hoàn tiền

### 1.2. Đặc điểm nổi bật
✅ **Tính toán tự động**: Hệ thống tự tính % hoàn tiền dựa trên thời gian  
✅ **Validation thông minh**: Không cho hủy dưới 6h, không hủy sau khi show đã bắt đầu  
✅ **Xử lý 2 trường hợp**: Vé chưa thanh toán (xóa luôn) vs Vé đã thanh toán (tính hoàn tiền)  
✅ **Email tự động**: Gửi email xác nhận với thông tin chi tiết  
✅ **Giải phóng ghế**: Tự động giải phóng ghế khi hủy  

---

## 2. CHÍNH SÁCH HOÀN TIỀN

### 2.1. Bảng Tỷ Lệ Hoàn Tiền

| Thời gian hủy trước suất chiếu | Tỷ lệ hoàn tiền | Mô tả |
|-------------------------------|-----------------|-------|
| **≥ 24 giờ** | **80%** | Hoàn cao nhất, khuyến khích hủy sớm |
| **12 - 24 giờ** | **50%** | Hoàn một nửa, phí hủy 50% |
| **6 - 12 giờ** | **20%** | Gần giờ chiếu, phí hủy cao |
| **< 6 giờ** | **0%** | Không được hủy | 

### 2.2. Quy Tắc Quan Trọng

**✅ Được hủy khi:**
- Còn ≥ 6 giờ trước suất chiếu
- Vé chưa bắt đầu chiếu
- Vé chưa được hủy trước đó

**❌ Không được hủy khi:**
- Dưới 6 giờ trước suất chiếu
- Sau khi suất chiếu đã bắt đầu
- Vé đã được hủy trước đó

### 2.3. Xử Lý 2 Trường Hợp

#### **Trường hợp 1: Vé CHƯA thanh toán**
- Xóa booking khỏi DB
- Giải phóng ghế
- **Không có giao dịch hoàn tiền** (vì chưa thanh toán)
- Không gửi email

#### **Trường hợp 2: Vé ĐÃ thanh toán**
- Cập nhật booking: `status = 'cancelled'`
- Tính hoàn tiền theo tỷ lệ
- Lưu `refundPercentage` và `refundAmount`
- Giải phóng ghế
- **Gửi email xác nhận** với thông tin hoàn tiền

---

## 3. CẤU TRÚC DỮ LIỆU

### 3.1. Booking Model (`server/models/Booking.js`)

```javascript
{
  user: ObjectId (ref: 'User'),
  show: ObjectId (ref: 'Show'),
  amount: Number,                    // Tổng tiền đã thanh toán
  bookedSeats: [String],              // ["A1", "A2", "B5"]
  ispaid: Boolean,                    // Đã thanh toán chưa
  paymentLink: String,               // Link Stripe checkout
  status: String,                     // "active" | "cancelled"
  cancelledAt: Date,                  // Thời điểm hủy
  refundPercentage: Number,           // % hoàn tiền: 80, 50, 20, 0
  refundAmount: Number                // Số tiền hoàn: amount × refundPercentage / 100
}
```

### 3.2. Hàm Tính Hoàn Tiền

**Code:** `server/controllers/bookingController.js` → `calculateRefundPercentage()`

```javascript
const calculateRefundPercentage = (showDateTime) => {
    const now = new Date();
    const showTime = new Date(showDateTime);
    const hoursUntilShow = (showTime - now) / (1000 * 60 * 60);

    if (hoursUntilShow >= 24) {
        return 80; // Hoàn 80% nếu hủy trước 24h
    } else if (hoursUntilShow >= 12) {
        return 50; // Hoàn 50% nếu hủy trước 12-24h
    } else if (hoursUntilShow >= 6) {
        return 20; // Hoàn 20% nếu hủy trước 6-12h
    } else {
        return 0; // Không hoàn nếu hủy dưới 6h
    }
};
```

**Logic:**
- Tính số giờ còn lại = `(showTime - now) / (1000 * 60 * 60)`
- So sánh với các mốc: 24h, 12h, 6h
- Trả về % tương ứng

---

## 4. LUỒNG NGHIỆP VỤ

### 4.1. Luồng Hủy Vé (User)

```
1. User → "Vé của tôi" (MyBookings)
2. Tìm vé cần hủy
3. Click "Hủy vé" (chỉ hiển thị nếu còn ≥ 6h)
4. Xác nhận hủy
5. Frontend gọi API: POST /api/booking/cancel/:bookingId
6. Backend xử lý:
   a. Validate: quyền sở hữu, trạng thái, thời gian
   b. Giải phóng ghế
   c. Nếu chưa thanh toán → Xóa booking
   d. Nếu đã thanh toán:
      - Tính refundPercentage
      - Tính refundAmount = amount × refundPercentage / 100
      - Update booking (status, refundPercentage, refundAmount)
      - Trigger Inngest event "app/booking.cancelled"
7. Inngest gửi email xác nhận hủy
8. User nhận thông báo + email
```

### 4.2. Luồng Tính Hoàn Tiền (Backend)

```
1. User click "Hủy vé"
2. Backend nhận request: POST /api/booking/cancel/:bookingId
3. Validate:
   - Booking tồn tại?
   - User có quyền hủy? (booking.user === userId)
   - Booking chưa bị hủy? (status !== 'cancelled')
   - Show chưa bắt đầu? (showDateTime > now)
4. Giải phóng ghế:
   - Xóa các ghế khỏi Show.occupiedSeats
   - Save Show
5. Kiểm tra ispaid:
   
   Nếu ispaid === false (chưa thanh toán):
   - Xóa booking khỏi DB
   - Return success (không có hoàn tiền)
   
   Nếu ispaid === true (đã thanh toán):
   - Tính refundPercentage = calculateRefundPercentage(showDateTime)
   - Nếu refundPercentage === 0:
     → Hoàn lại ghế (vì không được hủy)
     → Return error "Không thể hủy dưới 6h"
   - Nếu refundPercentage > 0:
     → Tính refundAmount = amount × refundPercentage / 100
     → Update booking:
        * status = 'cancelled'
        * cancelledAt = new Date()
        * refundPercentage = refundPercentage
        * refundAmount = refundAmount
     → Trigger Inngest event "app/booking.cancelled"
     → Return success + refund info
6. Inngest function "send-cancellation-email" gửi email
```

### 4.3. Luồng Gửi Email Hủy Vé

```
1. Backend trigger Inngest event: "app/booking.cancelled"
2. Inngest function "send-cancellation-email" được gọi
3. Lấy booking từ DB (populate show, movie, hall, user)
4. Tạo email HTML với:
   - Thông tin vé đã hủy (phim, suất chiếu, ghế)
   - Thông tin hoàn tiền (refundAmount, refundPercentage)
   - Chính sách hoàn vé
5. Gửi email đến booking.user.email
6. Subject: "🎫 Hủy vé thành công - Hoàn X% (Y VNĐ)"
```

---

## 5. CODE LIÊN QUAN

### 5.1. Backend

#### **Controller**
- `server/controllers/bookingController.js`:
  - `calculateRefundPercentage(showDateTime)` - Tính % hoàn tiền
  - `cancelBooking(req, res)` - API hủy vé

#### **Model**
- `server/models/Booking.js` - Schema Booking với các trường:
  - `status`: 'active' | 'cancelled'
  - `cancelledAt`: Date
  - `refundPercentage`: Number
  - `refundAmount`: Number

#### **Routes**
- `server/routes/bookingRoutes.js`:
  ```javascript
  bookingRouter.post('/cancel/:bookingId', cancelBooking);
  ```

#### **Inngest Functions**
- `server/inngest/index.js`:
  - `sendCancellationEmail` - Gửi email xác nhận hủy vé
  - Trigger: Event `app/booking.cancelled`

### 5.2. Frontend

#### **Pages**
- `client/src/pages/MyBookings.jsx`:
  - Hiển thị danh sách bookings
  - Nút "Hủy vé" (chỉ hiển thị nếu `canCancelBooking()`)
  - Hiển thị thông tin hoàn tiền cho vé đã hủy
  - Function `handleCancelBooking()` - Gọi API hủy vé
  - Function `canCancelBooking()` - Kiểm tra có thể hủy không

- `client/src/pages/RefundPolicy.jsx`:
  - Trang hiển thị chính sách hoàn tiền
  - Bảng tỷ lệ hoàn tiền theo thời gian
  - Hướng dẫn cách hủy vé

#### **Components**
- `client/src/components/Footer.jsx` - Link đến trang RefundPolicy

### 5.3. API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/booking/cancel/:bookingId` | Hủy vé | User (owner) |

**Request:**
```javascript
POST /api/booking/cancel/:bookingId
Headers: {
  Authorization: "Bearer <token>"
}
Body: {} // Empty
```

**Response (Success):**
```javascript
{
  success: true,
  message: "Hủy vé thành công. Bạn được hoàn 80% (200,000 ₫)",
  refundPercentage: 80,
  refundAmount: 200000
}
```

**Response (Error - Không được hủy):**
```javascript
{
  success: false,
  message: "Không thể hủy vé trong vòng 6 giờ trước suất chiếu"
}
```

### 5.4. Validation Logic

**Code:** `server/controllers/bookingController.js` → `cancelBooking()`

```javascript
// 1. Kiểm tra booking tồn tại
if (!booking) {
    return { success: false, message: 'Không tìm thấy đặt vé' };
}

// 2. Kiểm tra quyền sở hữu
if (booking.user._id.toString() !== userId) {
    return { success: false, message: 'Bạn không có quyền hủy vé này' };
}

// 3. Kiểm tra trạng thái
if (booking.status === 'cancelled') {
    return { success: false, message: 'Vé này đã được hủy trước đó' };
}

// 4. Kiểm tra thời gian
if (showTime <= now) {
    return { success: false, message: 'Không thể hủy vé sau khi suất chiếu đã bắt đầu' };
}

// 5. Tính % hoàn tiền
const refundPercentage = calculateRefundPercentage(booking.show.showDateTime);

// 6. Nếu không được hủy (< 6h)
if (refundPercentage === 0) {
    // Hoàn lại ghế vì không được phép hủy
    // ... restore seats ...
    return { success: false, message: 'Không thể hủy vé trong vòng 6 giờ trước suất chiếu' };
}
```

---

## 6. CÂU HỎI THƯỜNG GẶP KHI PHẢN BIỆN

### ❓ **Câu 1: "Em xử lý chính sách hoàn tiền như thế nào?"**

**Trả lời:**
> "Em xử lý chính sách hoàn tiền theo 4 mức độ dựa trên thời gian hủy:
> 
> 1. **Hủy trước ≥ 24 giờ**: Hoàn 80% - Khuyến khích hủy sớm
> 2. **Hủy trước 12-24 giờ**: Hoàn 50% - Phí hủy 50%
> 3. **Hủy trước 6-12 giờ**: Hoàn 20% - Gần giờ chiếu, phí hủy cao
> 4. **Hủy dưới 6 giờ**: Không được hủy - Quá gần giờ chiếu
> 
> Em có hàm `calculateRefundPercentage()` tự động tính % dựa trên số giờ còn lại trước suất chiếu. Khi user hủy vé, hệ thống:
> - Tính refundPercentage
> - Tính refundAmount = amount × refundPercentage / 100
> - Lưu vào booking (refundPercentage, refundAmount)
> - Gửi email xác nhận với thông tin hoàn tiền
> 
> **Xử lý 2 trường hợp:**
> - Vé chưa thanh toán: Xóa booking, không có hoàn tiền
> - Vé đã thanh toán: Tính hoàn tiền, gửi email"

### ❓ **Câu 2: "Tại sao em không cho hủy dưới 6 giờ?"**

**Trả lời:**
> "Em không cho hủy dưới 6 giờ vì:
> 
> 1. **Lý do nghiệp vụ**: Quá gần giờ chiếu, rạp đã chuẩn bị xong, việc hủy sẽ gây lãng phí và khó tìm người thay thế
> 
> 2. **Bảo vệ doanh thu**: Tránh tình trạng hủy vé vào phút cuối, ảnh hưởng đến doanh thu của rạp
> 
> 3. **Công bằng**: User có đủ thời gian (6 giờ) để quyết định hủy, nếu để đến phút cuối thì phải chịu trách nhiệm
> 
> 4. **Thực tế**: Tương tự các rạp phim thực tế, họ cũng có quy định không cho hủy/đổi vé gần giờ chiếu
> 
> **Code validation:**
> ```javascript
> if (refundPercentage === 0) {
>     // Hoàn lại ghế vì không được phép hủy
>     return { success: false, message: 'Không thể hủy vé trong vòng 6 giờ trước suất chiếu' };
> }
> ```"

### ❓ **Câu 3: "Em tính hoàn tiền như thế nào?"**

**Trả lời:**
> "Em tính hoàn tiền theo công thức:
> 
> ```
> refundAmount = (amount × refundPercentage) / 100
> ```
> 
> **Ví dụ:**
> - Vé giá: 250,000 VNĐ
> - Hủy trước 24h → refundPercentage = 80%
> - refundAmount = (250,000 × 80) / 100 = 200,000 VNĐ
> 
> **Code:**
> ```javascript
> const refundPercentage = calculateRefundPercentage(booking.show.showDateTime);
> const refundAmount = Math.floor((booking.amount * refundPercentage) / 100);
> ```
> 
> Hàm `calculateRefundPercentage()` tính số giờ còn lại và so sánh với các mốc 24h, 12h, 6h để trả về % tương ứng."

### ❓ **Câu 4: "Em xử lý vé chưa thanh toán như thế nào?"**

**Trả lời:**
> "Với vé chưa thanh toán (ispaid = false), em xử lý đơn giản hơn:
> 
> 1. **Xóa booking**: Không cần tính hoàn tiền vì chưa có giao dịch thanh toán
> 2. **Giải phóng ghế**: Xóa các ghế khỏi Show.occupiedSeats
> 3. **Không gửi email**: Vì không có giao dịch hoàn tiền
> 
> **Code:**
> ```javascript
> if (!booking.ispaid) {
>     await Booking.findByIdAndDelete(booking._id);
>     return res.json({ 
>         success: true, 
>         message: 'Hủy vé thành công'
>     });
> }
> ```
> 
> Điều này hợp lý vì user chưa trả tiền nên không cần hoàn tiền."

### ❓ **Câu 5: "Em gửi email xác nhận hủy như thế nào?"**

**Trả lời:**
> "Em sử dụng Inngest để gửi email tự động:
> 
> 1. **Trigger**: Sau khi hủy vé thành công, backend trigger Inngest event `app/booking.cancelled`
> 
> 2. **Inngest Function**: Function `send-cancellation-email` được gọi tự động
> 
> 3. **Nội dung email**:
>    - Thông tin vé đã hủy (phim, suất chiếu, ghế, số tiền đã thanh toán)
>    - Thông tin hoàn tiền (refundAmount, refundPercentage)
>    - Chính sách hoàn vé
>    - Link xem phim khác
> 
> 4. **Subject**: "🎫 Hủy vé thành công - Hoàn X% (Y VNĐ)"
> 
> **Code:** `server/inngest/index.js` → `sendCancellationEmail()`
> 
> Email được gửi tự động, không cần user làm gì thêm."

### ❓ **Câu 6: "Em validate hủy vé như thế nào?"**

**Trả lời:**
> "Em có nhiều lớp validation:
> 
> **1. Kiểm tra quyền sở hữu:**
>    - Chỉ owner của booking mới được hủy
>    ```javascript
>    if (booking.user._id.toString() !== userId) {
>        return { success: false, message: 'Bạn không có quyền hủy vé này' };
>    }
>    ```
> 
> **2. Kiểm tra trạng thái:**
>    - Không cho hủy vé đã bị hủy
>    ```javascript
>    if (booking.status === 'cancelled') {
>        return { success: false, message: 'Vé này đã được hủy trước đó' };
>    }
>    ```
> 
> **3. Kiểm tra thời gian:**
>    - Không cho hủy sau khi show đã bắt đầu
>    ```javascript
>    if (showTime <= now) {
>        return { success: false, message: 'Không thể hủy vé sau khi suất chiếu đã bắt đầu' };
>    }
>    ```
> 
> **4. Kiểm tra thời gian hủy:**
>    - Tính refundPercentage, nếu = 0 → không được hủy (< 6h)
>    ```javascript
>    if (refundPercentage === 0) {
>        // Hoàn lại ghế
>        return { success: false, message: 'Không thể hủy vé trong vòng 6 giờ trước suất chiếu' };
>    }
>    ```
> 
> **5. Frontend validation:**
>    - Chỉ hiển thị nút "Hủy vé" nếu `canCancelBooking()` = true
>    - Function này kiểm tra: status !== 'cancelled' && hoursUntilShow >= 6"

### ❓ **Câu 7: "Em giải phóng ghế khi hủy như thế nào?"**

**Trả lời:**
> "Khi hủy vé, em giải phóng ghế ngay lập tức:
> 
> **Code:**
> ```javascript
> const showData = await Show.findById(booking.show._id);
> booking.bookedSeats.forEach(seat => {
>     delete showData.occupiedSeats[seat];
> });
> showData.markModified('occupiedSeats');
> await showData.save();
> ```
> 
> **Quy trình:**
> 1. Lấy Show từ DB
> 2. Duyệt qua tất cả ghế đã đặt (`bookedSeats`)
> 3. Xóa từng ghế khỏi `Show.occupiedSeats` object
> 4. Dùng `markModified()` để báo cho Mongoose biết object đã thay đổi
> 5. Save Show
> 
> **Lưu ý**: Nếu không được hủy (< 6h), em sẽ hoàn lại ghế (restore) để đảm bảo ghế vẫn bị chiếm giữ."

---

## 📝 TÓM TẮT ĐIỂM MẠNH

✅ **Chính sách rõ ràng**: 4 mức độ hoàn tiền theo thời gian  
✅ **Tính toán tự động**: Hàm `calculateRefundPercentage()` tự động tính %  
✅ **Validation chặt chẽ**: Nhiều lớp kiểm tra (quyền, trạng thái, thời gian)  
✅ **Xử lý 2 trường hợp**: Vé chưa thanh toán vs đã thanh toán  
✅ **Email tự động**: Gửi email xác nhận với thông tin chi tiết  
✅ **Giải phóng ghế**: Tự động giải phóng ghế khi hủy  
✅ **UX tốt**: Chỉ hiển thị nút hủy khi có thể hủy, hiển thị thông tin hoàn tiền  

---

## 🎯 LƯU Ý KHI PHẢN BIỆN

1. **Nhấn mạnh tính công bằng**: Chính sách bảo vệ cả user và rạp
2. **Giải thích lý do**: Tại sao không cho hủy dưới 6h
3. **Demo nếu có thể**: Show cách hủy vé và nhận email
4. **Nói về tích hợp**: Inngest tự động gửi email, không cần can thiệp thủ công
5. **Validation**: Nhấn mạnh nhiều lớp kiểm tra để đảm bảo an toàn

---

## 📂 DANH SÁCH FILE CODE

### Backend:
- `server/models/Booking.js` - Model với các trường refund
- `server/controllers/bookingController.js` - Logic hủy vé và tính hoàn tiền
- `server/routes/bookingRoutes.js` - Route API hủy vé
- `server/inngest/index.js` - Function gửi email hủy vé

### Frontend:
- `client/src/pages/MyBookings.jsx` - Trang quản lý vé, nút hủy vé
- `client/src/pages/RefundPolicy.jsx` - Trang chính sách hoàn tiền
- `client/src/components/Footer.jsx` - Link đến RefundPolicy

---

**Chúc bạn phản biện thành công! 🎉**

