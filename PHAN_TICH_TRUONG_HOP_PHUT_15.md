# 🚨 PHÂN TÍCH: USER THANH TOÁN Ở PHÚT 15 (CODE HIỆN TẠI)

## ❓ CÂU HỎI

**"Nếu giữ nguyên code hiện tại, khi user thanh toán thành công ở phút thứ 15, thì:**
- **Booking có được tạo không?**
- **Hay là lỗi không cho thanh toán?**
- **Hay là số tiền đã thanh toán đó coi như bỏ?"**

---

## 📊 TIMELINE CHI TIẾT

### **T+0: Tạo Booking**

```javascript
// server/controllers/bookingController.js
const booking = await Booking.create({
    user: userId,
    show: showId,
    amount: totalAmount,
    bookedSeats: selectedSeats,
    ispaid: false  // ← Chưa thanh toán
});

// Tạo Stripe session (30 phút)
const session = await stripeInstance.checkout.sessions.create({
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,  // 30 phút
    metadata: { bookingId: booking._id.toString() }
});

// Trigger Inngest check sau 10 phút
await inngest.send({
    name: "app/checkpayment",
    data: { bookingId: booking._id.toString() }
});
```

**Trạng thái:**
- ✅ Booking được tạo: `ispaid = false`
- ✅ Ghế bị chiếm: `show.occupiedSeats[A1] = userId`
- ✅ Stripe session: 30 phút
- ✅ Inngest scheduled: Check sau 10 phút

---

### **T+10: Inngest Check Payment**

```javascript
// server/inngest/index.js - line 84-96
await step.run("check-payment-status", async () => {
    const bookingId = event.data.bookingId;
    const booking = await Booking.findById(bookingId);
    
    // ✅ CHECK: Nếu đã thanh toán → KHÔNG XÓA
    if (!booking.ispaid) {  // ← ispaid vẫn là false
        // Chưa thanh toán → Xóa booking
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat) => {
            delete show.occupiedSeats[seat];  // ← Giải phóng ghế
        });
        show.markModified('occupiedSeats');
        await show.save();
        await Booking.findByIdAndDelete(booking._id);  // ← XÓA BOOKING
    }
})
```

**Trạng thái sau T+10:**
- ❌ Booking đã bị XÓA khỏi DB
- ✅ Ghế đã được giải phóng (có thể đặt lại)
- ✅ Stripe session vẫn còn (20 phút nữa)

---

### **T+15: User Thanh Toán**

**Bước 1: User thanh toán trên Stripe**
```
User ở trang Stripe Checkout
→ Nhập thẻ và thanh toán
→ Stripe xử lý thanh toán thành công ✅
→ Stripe charge tiền từ thẻ user ✅
```

**Bước 2: Stripe gửi webhook**

```javascript
// server/controllers/stripeWebhooks.js - line 199-232
case 'payment_intent.succeeded': {
    const paymentIntent = event.data.object;
    const sessionList = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id
    });
    
    const session = sessionList.data[0];
    const { bookingId } = session.metadata;  // ← Lấy bookingId từ metadata
    
    // ⚠️ VẤN ĐỀ: Booking đã bị xóa ở T+10!
    await Booking.findByIdAndUpdate(bookingId, {  // ← bookingId không tồn tại
        ispaid: true,
        paymentLink: ""
    })
    // → findByIdAndUpdate trả về null (không throw error)
    
    // ⚠️ VẤN ĐỀ: Gọi function với bookingId không tồn tại
    await sendBookingConfirmationEmailDirect(bookingId);
    // → Function check if (!booking) return; → Không gửi email
}
```

**Code `sendBookingConfirmationEmailDirect`:**
```javascript
// server/controllers/stripeWebhooks.js - line 14-27
const sendBookingConfirmationEmailDirect = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId).populate(...);
        
        if (!booking) {  // ← Booking không tồn tại
            console.error('Booking not found:', bookingId);
            return;  // ← Chỉ return, không throw error
        }
        
        // ... gửi email ...
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
};
```

---

## 🔍 KẾT QUẢ THỰC TẾ

### **Điều gì xảy ra:**

1. ✅ **Stripe đã charge tiền từ thẻ user**
   - User đã thanh toán thành công trên Stripe
   - Tiền đã bị trừ khỏi thẻ

2. ❌ **Booking không tồn tại trong DB**
   - Đã bị xóa ở T+10
   - `findByIdAndUpdate` trả về `null` (không throw error)

3. ❌ **Không có email xác nhận**
   - `sendBookingConfirmationEmailDirect` check `if (!booking) return;`
   - Không gửi email

4. ❌ **Ghế đã được giải phóng**
   - Đã bị giải phóng ở T+10
   - Có thể đã có user khác đặt

5. ⚠️ **Webhook không báo lỗi**
   - `findByIdAndUpdate` với ID không tồn tại → Trả về `null`, không throw error
   - Code tiếp tục chạy bình thường
   - `response.json({ received: true })` → Stripe nghĩ webhook thành công

---

## 💸 HẬU QUẢ

### **User:**
- ✅ Đã thanh toán tiền (Stripe đã charge)
- ❌ Không có booking trong hệ thống
- ❌ Không có email xác nhận
- ❌ Không có QR code
- ❌ Không thể xem vé trong "Vé đặt của tôi"
- ❌ Ghế có thể đã bị user khác đặt

### **Rạp:**
- ✅ Đã nhận tiền (qua Stripe)
- ❌ Không có booking record
- ❌ Không biết user đã đặt ghế nào
- ❌ Không thể check-in user

### **Hệ thống:**
- ⚠️ Webhook "thành công" nhưng không làm gì
- ⚠️ Không có error log rõ ràng
- ⚠️ Data inconsistency (tiền đã thanh toán nhưng không có booking)

---

## 📝 CODE CHI TIẾT

### **1. Inngest Function (T+10)**

```javascript
// server/inngest/index.js
const booking = await Booking.findById(bookingId);

if (!booking.ispaid) {  // ← ispaid = false
    // Xóa booking
    await Booking.findByIdAndDelete(booking._id);  // ← XÓA
}
```

**Kết quả:** Booking bị xóa

---

### **2. Stripe Webhook (T+15)**

```javascript
// server/controllers/stripeWebhooks.js
const { bookingId } = session.metadata;  // ← bookingId từ metadata

// ⚠️ Booking đã bị xóa → findByIdAndUpdate trả về null
const result = await Booking.findByIdAndUpdate(bookingId, {
    ispaid: true,
    paymentLink: ""
});
// result = null (không throw error)

// ⚠️ Gọi function với bookingId không tồn tại
await sendBookingConfirmationEmailDirect(bookingId);
// → Function check if (!booking) return; → Không làm gì
```

**Kết quả:** 
- Không update được booking (vì không tồn tại)
- Không gửi email
- Không có error

---

## 🚨 VẤN ĐỀ NGHIÊM TRỌNG

### **1. User mất tiền nhưng không có vé**

- User đã thanh toán trên Stripe
- Nhưng booking không tồn tại
- User không thể xem vé, không có QR code
- Phải liên hệ hỗ trợ để giải quyết

### **2. Data inconsistency**

- Stripe có record thanh toán
- Database không có booking
- Không thể reconcile (đối soát)

### **3. Không có error handling**

- Webhook không check booking tồn tại
- Không log error rõ ràng
- Khó debug khi có vấn đề

---

## 🔧 GIẢI PHÁP TẠM THỜI (Nếu giữ nguyên code)

### **Option 1: Check booking tồn tại trong webhook**

```javascript
// server/controllers/stripeWebhooks.js
case 'payment_intent.succeeded': {
    const { bookingId } = session.metadata;
    
    // ✅ CHECK: Booking có tồn tại không?
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
        // Booking đã bị xóa → Log và return
        console.error('⚠️ Booking not found but payment succeeded:', {
            bookingId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            timestamp: new Date()
        });
        
        // TODO: Có thể tạo lại booking từ metadata hoặc refund
        return response.json({ received: true });  // Vẫn return success để Stripe không retry
    }
    
    // Booking tồn tại → Update bình thường
    await Booking.findByIdAndUpdate(bookingId, {
        ispaid: true,
        paymentLink: ""
    });
    
    await sendBookingConfirmationEmailDirect(bookingId);
    break;
}
```

**Ưu điểm:**
- ✅ Có log để tracking
- ✅ Không crash webhook

**Nhược điểm:**
- ❌ Vẫn không giải quyết được vấn đề (user mất tiền)

---

### **Option 2: Tạo lại booking nếu không tồn tại**

```javascript
// server/controllers/stripeWebhooks.js
case 'payment_intent.succeeded': {
    const { bookingId } = session.metadata;
    
    let booking = await Booking.findById(bookingId);
    
    if (!booking) {
        // Booking đã bị xóa → Tạo lại từ session metadata
        // ⚠️ VẤN ĐỀ: Cần lưu đủ thông tin vào session.metadata
        // Hiện tại chỉ có bookingId → Không đủ thông tin để tạo lại
        
        console.error('⚠️ Booking deleted but payment succeeded. Cannot restore without full metadata.');
        
        // TODO: Có thể refund hoặc tạo manual booking
        return response.json({ received: true });
    }
    
    // ... update booking ...
}
```

**Vấn đề:**
- ❌ Cần lưu đủ metadata (userId, showId, seats, amount...)
- ❌ Phức tạp, dễ sai

---

## 🎯 KẾT LUẬN

### **Với code hiện tại, khi user thanh toán ở phút 15:**

1. ✅ **Stripe đã charge tiền** (user đã mất tiền)
2. ❌ **Booking không tồn tại** (đã bị xóa ở T+10)
3. ❌ **Không có email xác nhận**
4. ❌ **Không có QR code**
5. ❌ **User không thể xem vé**
6. ⚠️ **Webhook "thành công" nhưng không làm gì**

**→ Đây là BUG NGHIÊM TRỌNG! User mất tiền nhưng không có vé!**

---

## 🛠️ GIẢI PHÁP TỐT NHẤT

### **Đồng bộ cả 2 về 30 phút:**

```javascript
// server/inngest/index.js
const thirtyMinutesLater = new Date(Date.now() + 30 * 60 * 1000);  // 30 phút
await step.sleepUntil('wait-for-30-minutes', thirtyMinutesLater);
```

**Kết quả:**
- ✅ Stripe session hết hạn ở T+30
- ✅ Inngest check ở T+30
- ✅ Không còn race condition
- ✅ User có đủ thời gian thanh toán

---

## 📊 BẢNG TÓM TẮT

| Thời điểm | Sự kiện | Kết quả |
|-----------|---------|---------|
| **T+0** | Tạo booking + Stripe session (30p) + Inngest (10p) | ✅ OK |
| **T+10** | Inngest check → `ispaid = false` → Xóa booking | ❌ Booking bị xóa |
| **T+15** | User thanh toán → Stripe charge tiền ✅ | ✅ Stripe thành công |
| **T+15.1** | Stripe webhook → Tìm booking | ❌ Booking không tồn tại |
| **T+15.2** | `findByIdAndUpdate` → Trả về `null` | ⚠️ Không update được |
| **T+15.3** | `sendEmail` → Check `if (!booking)` → Return | ⚠️ Không gửi email |
| **Kết quả** | User mất tiền nhưng không có vé | ❌❌❌ **BUG NGHIÊM TRỌNG** |

---

## 🎓 TRẢ LỜI CHO GIẢNG VIÊN

**Nếu giảng viên hỏi về trường hợp này:**

> "Với code hiện tại, nếu user thanh toán ở phút 15, sẽ xảy ra **vấn đề nghiêm trọng**:
>
> **Timeline:**
> - T+10: Inngest check → Booking chưa thanh toán → Xóa booking
> - T+15: User thanh toán → Stripe charge tiền thành công
> - T+15.1: Stripe webhook → Tìm booking để update → Booking không tồn tại
>
> **Kết quả:**
> - ✅ User đã thanh toán tiền (Stripe đã charge)
> - ❌ Booking không tồn tại trong DB (đã bị xóa)
> - ❌ User không có email xác nhận, không có QR code
> - ❌ User không thể xem vé trong "Vé đặt của tôi"
> - ⚠️ Webhook không báo lỗi (vì `findByIdAndUpdate` với ID không tồn tại chỉ trả về `null`, không throw error)
>
> **Đây là bug nghiêm trọng:** User mất tiền nhưng không có vé!
>
> **Giải pháp:**
> - Đồng bộ cả 2 về 30 phút (Stripe session + Inngest check)
> - Hoặc thêm check trong webhook để log và xử lý trường hợp booking không tồn tại
> - Hoặc tạo lại booking từ metadata nếu bị xóa (nhưng cần lưu đủ metadata)
>
> Trong scope dự án, em khuyến nghị giải pháp 1 (đồng bộ 30 phút) vì đơn giản và hiệu quả nhất."

---

*Tài liệu này phân tích chi tiết trường hợp user thanh toán ở phút 15 với code hiện tại.*


