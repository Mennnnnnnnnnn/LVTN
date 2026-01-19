# 🚨 GIẢI THÍCH RACE CONDITION: TỰ ĐỘNG HỦY 10 PHÚT VS STRIPE SESSION 30 PHÚT

## ❓ VẤN ĐỀ

**Câu hỏi:** Nếu tự động hủy booking sau 10 phút, nhưng Stripe session còn 30 phút, thì khách hàng thanh toán ở phút thứ 15 sẽ như thế nào?

---

## 📊 TIMELINE VÀ CÁC TRƯỜNG HỢP

### **T+0: Tạo Booking**
```
- Booking được tạo: ispaid = false
- Stripe session được tạo: expires_at = T+30 phút
- Inngest event "app/checkpayment" được trigger
```

### **T+10: Inngest Check Payment**

**Code hiện tại:**
```javascript
// server/inngest/index.js - line 84-96
await step.run("check-payment-status", async () => {
    const booking = await Booking.findById(bookingId);
    
    // ✅ CHECK: Nếu đã thanh toán → KHÔNG XÓA
    if (!booking.ispaid) {
        // Chưa thanh toán → Xóa booking và giải phóng ghế
        // ...
        await Booking.findByIdAndDelete(booking._id);
    }
    // Nếu ispaid = true → Không làm gì (user đã thanh toán)
})
```

---

## ✅ TRƯỜNG HỢP 1: USER THANH TOÁN TRƯỚC 10 PHÚT

```
T+0:  Tạo booking (ispaid = false)
T+5:  User thanh toán → Stripe webhook → ispaid = true ✅
T+10: Inngest check → ispaid = true → KHÔNG XÓA ✅
```

**Kết quả:** ✅ **OK** - Booking được giữ lại

---

## ⚠️ TRƯỜNG HỢP 2: USER THANH TOÁN SAU 10 PHÚT (PHÚT 15)

### **Scenario A: Webhook đến TRƯỚC khi Inngest xóa**

```
T+0:  Tạo booking (ispaid = false)
T+10: Inngest check → ispaid = false → Bắt đầu xóa...
T+15: User thanh toán → Stripe webhook → Update ispaid = true ✅
      (Nhưng Inngest đã bắt đầu xóa...)
```

**Vấn đề:** Race condition!

**Code hiện tại có xử lý:**
```javascript
// Inngest function check TRƯỚC KHI xóa
if (!booking.ispaid) {  // ← Check lại lần nữa
    // Chỉ xóa nếu vẫn chưa thanh toán
}
```

**Nhưng vẫn có khả năng:**
- Inngest đã query booking ở T+10 → `ispaid = false`
- Webhook update ở T+15 → `ispaid = true`
- Inngest xóa ở T+15.1 → **Booking bị xóa dù đã thanh toán!** ❌

---

### **Scenario B: Webhook đến SAU khi Inngest xóa**

```
T+0:  Tạo booking (ispaid = false)
T+10: Inngest check → ispaid = false → Xóa booking ✅
T+15: User thanh toán → Stripe webhook → Booking không tồn tại ❌
```

**Kết quả:** ❌ **LỖI** - Webhook không tìm thấy booking

**Code webhook:**
```javascript
// server/controllers/stripeWebhooks.js - line 226
await Booking.findByIdAndUpdate(bookingId, {
    ispaid: true,
    paymentLink: ""
})
// Nếu booking không tồn tại → findByIdAndUpdate trả về null
// → Không có error, nhưng cũng không update được
```

---

## 🔍 PHÂN TÍCH CODE HIỆN TẠI

### **1. Inngest Function (Tự động hủy)**

```javascript
// server/inngest/index.js
const releaseSeatAndDeleteBooking = inngest.createFunction(
    { id: 'release-seats-delete-booking' },
    { event: "app/checkpayment" },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

        await step.run("check-payment-status", async () => {
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId);
            
            // ✅ CHECK: Nếu đã thanh toán → KHÔNG XÓA
            if (!booking.ispaid) {
                // Xóa booking
                await Booking.findByIdAndDelete(booking._id);
            }
            // Nếu ispaid = true → Không làm gì
        })
    }
)
```

**Điểm tốt:**
- ✅ Check `ispaid` trước khi xóa
- ✅ Nếu đã thanh toán → Không xóa

**Điểm yếu:**
- ⚠️ Race condition: Nếu webhook update giữa lúc Inngest đang xóa
- ⚠️ Không có transaction/lock để đảm bảo atomicity

---

### **2. Stripe Webhook Handler**

```javascript
// server/controllers/stripeWebhooks.js
case 'payment_intent.succeeded': {
    const { bookingId } = session.metadata;
    
    // Update booking
    await Booking.findByIdAndUpdate(bookingId, {
        ispaid: true,
        paymentLink: ""
    })
    
    // Gửi email
    await sendBookingConfirmationEmailDirect(bookingId);
}
```

**Điểm tốt:**
- ✅ Update `ispaid = true` ngay khi thanh toán thành công

**Điểm yếu:**
- ⚠️ Không check booking có tồn tại không
- ⚠️ Nếu booking đã bị xóa → `findByIdAndUpdate` trả về `null` → Không có error

---

## 🛠️ GIẢI PHÁP ĐỀ XUẤT

### **Giải pháp 1: Tăng thời gian check lên 30 phút (Đơn giản nhất)**

```javascript
// Thay đổi từ 10 phút → 30 phút
const thirtyMinutesLater = new Date(Date.now() + 30 * 60 * 1000);
await step.sleepUntil('wait-for-30-minutes', thirtyMinutesLater);
```

**Ưu điểm:**
- ✅ Đơn giản, không cần thay đổi nhiều code
- ✅ Đảm bảo không xóa booking khi Stripe session còn valid

**Nhược điểm:**
- ❌ Ghế bị lock lâu hơn (30 phút thay vì 10 phút)
- ❌ User có thể quên, không thanh toán

---

### **Giải pháp 2: Check Stripe Session Status (Tốt hơn)**

```javascript
await step.run("check-payment-status", async () => {
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
        // Booking đã bị xóa (có thể user đã hủy thủ công)
        return;
    }
    
    // ✅ CHECK: Nếu đã thanh toán → KHÔNG XÓA
    if (booking.ispaid) {
        console.log('Booking already paid, skip deletion');
        return;
    }
    
    // ✅ CHECK: Kiểm tra Stripe session status
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(
        booking.paymentLink.split('/').pop() // Extract session ID
    );
    
    if (session.payment_status === 'paid') {
        // User đã thanh toán nhưng webhook chưa đến
        // → Update booking và không xóa
        await Booking.findByIdAndUpdate(bookingId, {
            ispaid: true,
            paymentLink: ""
        });
        return;
    }
    
    if (session.status === 'expired') {
        // Session đã hết hạn → Xóa booking
        // ...
    }
    
    // Nếu session vẫn còn valid → Không xóa (đợi thêm)
    // Hoặc xóa nếu đã quá 30 phút
})
```

**Ưu điểm:**
- ✅ Chính xác hơn: Check trực tiếp từ Stripe
- ✅ Xử lý được race condition

**Nhược điểm:**
- ❌ Phức tạp hơn, cần thêm API call đến Stripe
- ❌ Tốn thêm 1 API call mỗi lần check

---

### **Giải pháp 3: Sử dụng MongoDB Transaction (Tốt nhất)**

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
    // Lock booking document
    const booking = await Booking.findById(bookingId)
        .session(session)
        .select('ispaid');
    
    if (!booking) {
        await session.abortTransaction();
        return;
    }
    
    // Check payment status trong transaction
    if (booking.ispaid) {
        await session.abortTransaction();
        return;
    }
    
    // Xóa booking trong transaction
    await Booking.findByIdAndDelete(bookingId).session(session);
    
    // Giải phóng ghế
    // ...
    
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

**Ưu điểm:**
- ✅ Đảm bảo atomicity (không có race condition)
- ✅ Database-level lock

**Nhược điểm:**
- ❌ Phức tạp hơn
- ❌ Cần MongoDB replica set (transaction chỉ hoạt động với replica set)

---

### **Giải pháp 4: Webhook Retry với Idempotency (Khuyến nghị)**

```javascript
// Webhook handler
case 'payment_intent.succeeded': {
    const { bookingId } = session.metadata;
    
    // ✅ Tìm hoặc tạo lại booking nếu đã bị xóa
    let booking = await Booking.findById(bookingId);
    
    if (!booking) {
        // Booking đã bị xóa → Tạo lại từ session metadata
        // (Cần lưu thêm thông tin vào Stripe session metadata)
        booking = await Booking.create({
            _id: bookingId,
            // ... restore từ metadata
            ispaid: true
        });
    } else {
        // Update booking
        await Booking.findByIdAndUpdate(bookingId, {
            ispaid: true,
            paymentLink: ""
        });
    }
    
    // Gửi email
    await sendBookingConfirmationEmailDirect(bookingId);
}
```

**Ưu điểm:**
- ✅ Xử lý được trường hợp booking đã bị xóa
- ✅ Idempotent (có thể retry nhiều lần)

**Nhược điểm:**
- ❌ Cần lưu đủ metadata vào Stripe session
- ❌ Phức tạp hơn

---

## 📝 KẾT LUẬN VÀ KHUYẾN NGHỊ

### **Tình trạng hiện tại:**

✅ **Code đã có xử lý cơ bản:**
- Check `ispaid` trước khi xóa
- Nếu đã thanh toán → Không xóa

⚠️ **Vẫn có race condition:**
- Nếu webhook đến sau khi Inngest đã xóa → Booking mất
- Nếu webhook và Inngest chạy đồng thời → Có thể xóa nhầm

---

### **Giải pháp nhanh (cho bảo vệ):**

**Option 1: Tăng thời gian check lên 30 phút**
```javascript
// Đơn giản nhất, đảm bảo không xóa khi session còn valid
const thirtyMinutesLater = new Date(Date.now() + 30 * 60 * 1000);
```

**Option 2: Check booking tồn tại trong webhook**
```javascript
// Thêm check trong webhook
const booking = await Booking.findById(bookingId);
if (!booking) {
    console.log('Booking already deleted, skip webhook');
    return;
}
```

---

### **Giải pháp tốt nhất (sau bảo vệ):**

1. **Sử dụng MongoDB Transaction** (nếu có replica set)
2. **Hoặc check Stripe session status** trước khi xóa
3. **Hoặc tăng thời gian check lên 30 phút** (đơn giản nhất)

---

## 🎯 TRẢ LỜI CHO GIẢNG VIÊN

**Nếu giảng viên hỏi về race condition này:**

> "Em đã nhận thức được vấn đề race condition giữa Inngest tự động hủy (10 phút) và Stripe session (30 phút). 
>
> **Giải pháp hiện tại:** Code có check `ispaid` trước khi xóa, nên nếu user thanh toán trước 10 phút thì booking sẽ được giữ lại.
>
> **Trường hợp edge case:** Nếu user thanh toán ở phút 15 (sau khi Inngest đã check), có thể xảy ra race condition. 
>
> **Giải pháp đề xuất:** 
> 1. Tăng thời gian check lên 30 phút (đơn giản nhất)
> 2. Hoặc check Stripe session status trước khi xóa (chính xác hơn)
> 3. Hoặc sử dụng MongoDB transaction để đảm bảo atomicity (tốt nhất)
>
> Trong scope dự án học tập, em ưu tiên giải pháp 1 vì đơn giản và đảm bảo không xóa booking khi Stripe session còn valid."

---

*Tài liệu này giải thích chi tiết về race condition và các giải pháp đề xuất.*


