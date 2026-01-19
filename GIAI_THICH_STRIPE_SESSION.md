# 💳 GIẢI THÍCH STRIPE CHECKOUT SESSION 30 PHÚT

## ❓ CÂU HỎI

**"Stripe session 30 phút là gì? Có phải là 30 phút hiển thị giao diện thanh toán cho người dùng không?"**

---

## 📋 STRIPE CHECKOUT SESSION LÀ GÌ?

### **1. Khái niệm**

**Stripe Checkout Session** là một **link thanh toán** được tạo bởi Stripe, cho phép user thanh toán online.

**Không phải** là giao diện hiển thị liên tục 30 phút, mà là:
- ✅ **Link thanh toán** có thời hạn 30 phút
- ✅ User click vào link → Chuyển đến **Stripe Checkout page** (trang thanh toán của Stripe)
- ✅ User có **30 phút** để thanh toán trên trang đó
- ✅ Sau 30 phút, link **hết hạn** → User không thể thanh toán nữa

---

## 🔄 QUY TRÌNH THỰC TẾ

### **Bước 1: User click "Thanh toán"**

```
User chọn ghế → Click "Thanh toán"
↓
Backend tạo Booking (ispaid = false)
↓
Backend tạo Stripe Checkout Session
↓
Backend trả về: { success: true, url: "https://checkout.stripe.com/..." }
↓
Frontend redirect: window.location.href = url
```

### **Bước 2: User được chuyển đến Stripe Checkout**

```
User được redirect đến: https://checkout.stripe.com/pay/cs_test_...
```

**Giao diện Stripe Checkout:**
```
┌─────────────────────────────────────┐
│  🎬 QUICKSHOW                       │
│                                     │
│  Avatar: Fire and Ash               │
│  2 ghế: A1, A2                     │
│                                     │
│  Tổng tiền: 180.000₫               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Số thẻ: [4242 4242 4242 4242]│   │
│  │ Ngày hết hạn: [12/25]       │   │
│  │ CVV: [123]                  │   │
│  │ Tên chủ thẻ: [NGUYEN VAN A] │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Thanh toán ngay]                 │
│                                     │
│  ⏰ Session hết hạn sau: 25:30     │
└─────────────────────────────────────┘
```

**Đây là trang của Stripe, không phải trang của bạn!**

### **Bước 3: User thanh toán**

- User nhập thông tin thẻ
- Click "Thanh toán ngay"
- Stripe xử lý thanh toán
- Nếu thành công → Redirect về `success_url`
- Nếu thất bại → Hiển thị lỗi trên trang Stripe

### **Bước 4: Sau 30 phút**

- Link hết hạn
- Nếu user quay lại link cũ → Stripe hiển thị: "This session has expired"
- User không thể thanh toán nữa

---

## ⏰ 30 PHÚT LÀ GÌ?

### **Không phải:**
- ❌ 30 phút hiển thị giao diện thanh toán
- ❌ 30 phút user phải ngồi đó nhập thông tin
- ❌ 30 phút countdown trên màn hình

### **Mà là:**
- ✅ **30 phút thời hạn của link thanh toán**
- ✅ User có thể **đóng trang**, quay lại sau (trong vòng 30 phút)
- ✅ User có thể **mở link trên thiết bị khác** (trong vòng 30 phút)
- ✅ Sau 30 phút, link **không còn hợp lệ** nữa

---

## 📱 VÍ DỤ THỰC TẾ

### **Scenario 1: User thanh toán ngay**

```
T+0:  User click "Thanh toán"
      → Redirect đến Stripe Checkout
      → Link có thời hạn: 30 phút

T+2:  User nhập thẻ và thanh toán
      → Thanh toán thành công ✅
      → Redirect về /my-bookings
      → Booking.ispaid = true
```

**Kết quả:** ✅ Thanh toán thành công, link không cần dùng nữa

---

### **Scenario 2: User đóng trang, quay lại sau**

```
T+0:  User click "Thanh toán"
      → Redirect đến Stripe Checkout
      → Link có thời hạn: 30 phút

T+1:  User đóng tab (chưa thanh toán)
      → Link vẫn còn trong booking.paymentLink

T+15: User vào "Vé đặt của tôi"
      → Click "Thanh toán ngay"
      → Mở lại link Stripe (vẫn còn 15 phút)
      → User thanh toán ✅
```

**Kết quả:** ✅ User có thể quay lại thanh toán trong 30 phút

---

### **Scenario 3: User quên, quay lại sau 30 phút**

```
T+0:  User click "Thanh toán"
      → Redirect đến Stripe Checkout
      → Link có thời hạn: 30 phút

T+35: User quay lại, click "Thanh toán ngay"
      → Mở link Stripe
      → Stripe hiển thị: "This session has expired" ❌
      → User không thể thanh toán
```

**Kết quả:** ❌ Link hết hạn, user phải đặt lại

---

## 💻 CODE THỰC TẾ

### **1. Tạo Stripe Checkout Session**

```javascript
// server/controllers/bookingController.js - line 222-231
const session = await stripeInstance.checkout.sessions.create({
    success_url: `${origin}/loading/my-bookings`,  // Redirect sau khi thanh toán thành công
    cancel_url: `${origin}/my-bookings`,          // Redirect nếu user hủy
    line_items: [{
        price_data: {
            currency: 'vnd',
            product_data: {
                name: showData.movie.title
            },
            unit_amount: Math.floor(booking.amount),
        },
        quantity: 1,
    }],
    mode: 'payment',
    metadata: {
        bookingId: booking._id.toString(),  // Lưu bookingId để webhook biết
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,  // ← 30 PHÚT
})

// Lưu link vào booking
booking.paymentLink = session.url;  // Ví dụ: "https://checkout.stripe.com/pay/cs_test_..."
await booking.save();

// Trả về link cho frontend
res.json({ success: true, url: session.url });
```

**Giải thích:**
- `expires_at`: Thời điểm link hết hạn (Unix timestamp)
- `Math.floor(Date.now() / 1000)`: Thời điểm hiện tại (giây)
- `+ 30 * 60`: Cộng thêm 30 phút (1800 giây)

---

### **2. Frontend redirect user**

```javascript
// client/src/pages/SeatLayout.jsx
const handleBookNow = async () => {
    // ... validation ...
    
    const { data } = await axios.post('/api/booking/create', {
        showId: selectedTime.showId,
        selectedSeats: selectedSeats
    });
    
    if (data.success) {
        // Redirect đến Stripe Checkout
        window.location.href = data.url;  // ← Chuyển đến Stripe
    }
}
```

**Kết quả:** User được chuyển đến trang Stripe Checkout

---

### **3. User thanh toán trên Stripe**

**Trang Stripe Checkout:**
- User nhập thông tin thẻ
- Click "Thanh toán"
- Stripe xử lý thanh toán
- Nếu thành công → Redirect về `success_url`
- Stripe gửi webhook về backend

---

### **4. Webhook xử lý thanh toán**

```javascript
// server/controllers/stripeWebhooks.js
case 'payment_intent.succeeded': {
    const { bookingId } = session.metadata;
    
    // Update booking: đã thanh toán
    await Booking.findByIdAndUpdate(bookingId, {
        ispaid: true,
        paymentLink: ""  // Xóa link vì đã thanh toán
    })
    
    // Gửi email xác nhận
    await sendBookingConfirmationEmailDirect(bookingId);
}
```

---

## 🎯 SO SÁNH VỚI THỰC TẾ

### **CGV, Lotte Cinema:**

```
1. User chọn ghế → Click "Thanh toán"
2. Chuyển đến trang thanh toán (MoMo, ZaloPay, VNPay...)
3. User có thời hạn để thanh toán (thường 15-30 phút)
4. Sau thời hạn → Link hết hạn, phải đặt lại
```

**Tương tự với Stripe Checkout!**

---

## 📊 TIMELINE CHI TIẾT

```
T+0:  User click "Thanh toán"
      ↓
      Backend tạo Stripe Session (expires_at = T+30)
      ↓
      Frontend redirect: window.location.href = session.url
      ↓
      User ở trang Stripe Checkout
      ↓
      [User có thể đóng trang, quay lại sau...]
      ↓
T+2:  User nhập thẻ và thanh toán
      ↓
      Stripe xử lý thanh toán
      ↓
      Stripe webhook → Backend update ispaid = true
      ↓
      User redirect về /my-bookings
      ↓
      ✅ Hoàn tất

HOẶC

T+0:  User click "Thanh toán"
      ↓
      User ở trang Stripe Checkout
      ↓
      [User đóng trang, chưa thanh toán]
      ↓
T+15: User vào "Vé đặt của tôi"
      ↓
      Click "Thanh toán ngay" (mở lại link)
      ↓
      Link vẫn còn 15 phút → User thanh toán ✅

HOẶC

T+0:  User click "Thanh toán"
      ↓
      User ở trang Stripe Checkout
      ↓
      [User quên, không thanh toán]
      ↓
T+30: Link hết hạn
      ↓
T+35: User quay lại, click "Thanh toán ngay"
      ↓
      Stripe: "Session expired" ❌
      ↓
      User phải đặt lại
```

---

## 🔍 CÁC TRƯỜNG HỢP ĐẶC BIỆT

### **1. User thanh toán ở phút thứ 29**

```
T+0:  Session tạo (expires_at = T+30)
T+29: User thanh toán
      → Stripe vẫn chấp nhận (còn 1 phút)
      → Thanh toán thành công ✅
```

**Kết quả:** ✅ OK - Thanh toán thành công

---

### **2. User thanh toán ở phút thứ 30.1**

```
T+0:  Session tạo (expires_at = T+30)
T+30.1: User click "Thanh toán"
        → Stripe: "Session expired" ❌
        → User không thể thanh toán
```

**Kết quả:** ❌ Link hết hạn, user phải đặt lại

---

### **3. User mở link trên nhiều tab**

```
T+0:  User click "Thanh toán"
      → Tab 1: Mở Stripe Checkout
      → Tab 2: Mở lại link (cùng session)
      → Cả 2 tab đều hiển thị cùng session
      → User thanh toán ở Tab 1
      → Tab 2 tự động refresh → "Payment successful"
```

**Kết quả:** ✅ Stripe xử lý được multiple tabs

---

## 💡 TẠI SAO 30 PHÚT?

### **Lý do:**

1. **Đủ thời gian cho user:**
   - User có thể đóng trang, quay lại sau
   - User có thể tìm thẻ, nhập thông tin
   - User có thể xử lý vấn đề (OTP, bank error...)

2. **Không quá dài:**
   - Tránh ghế bị lock quá lâu
   - Tránh user quên, không thanh toán
   - Balance giữa UX và inventory management

3. **Industry standard:**
   - CGV, Lotte: ~15-30 phút
   - Airline tickets: 10-30 phút
   - E-commerce: 30-60 phút

---

## 🎓 TRẢ LỜI CHO GIẢNG VIÊN

**Nếu giảng viên hỏi về Stripe session 30 phút:**

> "Stripe Checkout Session là một **link thanh toán** có thời hạn 30 phút, không phải là giao diện hiển thị liên tục 30 phút.
>
> **Quy trình:**
> 1. Backend tạo Stripe Checkout Session với `expires_at = now + 30 phút`
> 2. Backend trả về URL (ví dụ: `https://checkout.stripe.com/pay/cs_test_...`)
> 3. Frontend redirect user đến URL này
> 4. User được chuyển đến **trang thanh toán của Stripe** (không phải trang của em)
> 5. User có **30 phút** để thanh toán trên trang đó
> 6. User có thể đóng trang, quay lại sau (trong vòng 30 phút)
> 7. Sau 30 phút, link hết hạn → User không thể thanh toán nữa
>
> **Ví dụ thực tế:** Tương tự như CGV, Lotte - user được chuyển đến trang thanh toán MoMo/ZaloPay, có thời hạn để thanh toán.
>
> **Lý do chọn 30 phút:** Đủ thời gian cho user xử lý (tìm thẻ, nhập thông tin, xử lý lỗi), nhưng không quá dài để tránh ghế bị lock lâu."

---

## 📝 TÓM TẮT

| Khái niệm | Giải thích |
|-----------|------------|
| **Stripe Checkout Session** | Link thanh toán được tạo bởi Stripe |
| **30 phút** | Thời hạn của link (không phải thời gian hiển thị) |
| **User experience** | User được redirect đến trang Stripe, có 30 phút để thanh toán |
| **Có thể đóng trang** | User có thể đóng và quay lại sau (trong 30 phút) |
| **Sau 30 phút** | Link hết hạn, user không thể thanh toán nữa |

---

*Tài liệu này giải thích chi tiết về Stripe Checkout Session và thời hạn 30 phút.*


