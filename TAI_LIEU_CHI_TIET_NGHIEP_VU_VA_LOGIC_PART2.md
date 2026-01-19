# Tài liệu chi tiết nghiệp vụ và logic hệ thống (Phần 2)

## 8. MODULE BACKGROUND JOBS (Inngest)

### 8.4. Tự động hủy booking chưa thanh toán

- **File**: `server/inngest/index.js` - `releaseSeatAndDeleteBooking()`
- **Trigger**: Event `app/checkpayment`
- **Route/Endpoint**: Không có route trực tiếp, được trigger bởi Inngest event
- **Nghiệp vụ**:
  - Nhận event `app/checkpayment` với data `{bookingId}`
  - Đợi 10 phút sau khi booking được tạo (sử dụng `step.sleepUntil`)
  - Sau 10 phút, kiểm tra trạng thái thanh toán của booking
  - Nếu `ispaid = false` (chưa thanh toán):
    - Lấy thông tin show từ booking
    - Giải phóng tất cả ghế đã chiếm giữ (xóa khỏi `occupiedSeats`)
    - Xóa booking khỏi database
  - Nếu `ispaid = true` (đã thanh toán): Không làm gì, booking được giữ lại
- **Validation**: 
  - Chỉ xóa booking nếu `ispaid = false`
  - Kiểm tra booking tồn tại trước khi xử lý
- **Cách hoạt động**:
  1. Khi tạo booking, controller gọi `inngest.send()` với event `app/checkpayment`
  2. Inngest function nhận event và đợi 10 phút
  3. Sau 10 phút, function chạy và kiểm tra `booking.ispaid`
  4. Nếu chưa thanh toán → giải phóng ghế và xóa booking
  5. Nếu đã thanh toán → không làm gì
- **Response**: Không có response trực tiếp (background job)

### 8.5. Gửi email xác nhận đặt vé

- **File**: `server/inngest/index.js` - `sendBookingConfirmationEmail()`
- **Trigger**: Event `app/show.booked` (hiện tại không được sử dụng, thay vào đó dùng `sendBookingConfirmationEmailDirect` trong webhook)
- **Route/Endpoint**: Không có route trực tiếp
- **Nghiệp vụ**:
  - Nhận event `app/show.booked` với data `{bookingId}`
  - Lấy thông tin booking đầy đủ (populate show, movie, hall, user, promotionApplied)
  - Tạo QR code chứa thông tin booking:
    - Format JSON: `{bookingId, userId, showId, seats}`
    - Generate QR code dạng PNG buffer
    - Convert sang base64 để đính kèm email
  - Format thông tin phim, suất chiếu, ghế ngồi
  - Tính toán và hiển thị thông tin khuyến mãi nếu có:
    - originalAmount (giá gốc)
    - discountAmount (số tiền được giảm)
    - finalAmount (số tiền cuối cùng)
  - Gửi email HTML với:
    - Thông tin phim (tên, ngày chiếu, giờ chiếu, phòng, thời lượng)
    - Chi tiết đặt vé (mã booking, số ghế, danh sách ghế)
    - Thông tin thanh toán (số ghế, tạm tính, khuyến mãi nếu có, tổng thanh toán)
    - QR code đính kèm (file `qrcode.png`)
    - Lưu ý quan trọng về check-in
- **Validation**: 
  - Kiểm tra booking tồn tại
  - Kiểm tra booking đã có đầy đủ thông tin (show, movie, hall, user)
- **Cách hoạt động**:
  1. Function được trigger bởi event `app/show.booked`
  2. Lấy thông tin booking và các relations
  3. Tạo QR code từ thông tin booking
  4. Format email HTML với đầy đủ thông tin
  5. Gửi email qua NodeMailer với QR code đính kèm
- **Response**: Không có response trực tiếp (background job)

### 8.6. Gửi email nhắc nhở

- **File**: `server/inngest/index.js` - `sendShowReminders()`
- **Trigger**: Cron job `0 */1 * * *` (chạy mỗi 1 giờ)
- **Route/Endpoint**: Không có route trực tiếp, chạy tự động theo lịch
- **Nghiệp vụ**:
  - Chạy tự động mỗi 1 giờ
  - Tính toán thời gian: `now` và `in3Hours` (3 giờ sau)
  - Tìm tất cả shows có `showDateTime` trong khoảng `[now, in3Hours)`
  - Populate thông tin movie cho mỗi show
  - Lấy danh sách userIds từ `occupiedSeats` của mỗi show (loại bỏ duplicate)
  - Lấy thông tin user (name, email) từ database
  - Tạo danh sách tasks gửi email cho mỗi user
  - Gửi email nhắc nhở cho tất cả users đã đặt vé:
    - Subject: `Nhắc nhở: Phim "{movieTitle}" sắp bắt đầu chiếu!`
    - Nội dung: Thông báo phim sẽ chiếu trong 3 giờ nữa, kèm ngày giờ chiếu
  - Xử lý lỗi: Sử dụng `Promise.allSettled` để không dừng khi 1 email lỗi
- **Validation**: 
  - Chỉ gửi cho shows trong khoảng 3 giờ tới
  - Chỉ gửi cho users đã đặt vé (có trong occupiedSeats)
  - Bỏ qua shows không có movie hoặc không có occupiedSeats
- **Cách hoạt động**:
  1. Cron job trigger function mỗi 1 giờ
  2. Tìm shows sẽ chiếu trong 3 giờ tới
  3. Extract userIds từ occupiedSeats
  4. Lấy thông tin users
  5. Gửi email nhắc nhở cho từng user
  6. Trả về số lượng email đã gửi thành công/thất bại
- **Response**: `{sent: number, failed: number, message: string}`

### 8.7. Gửi email thông báo phim mới

- **File**: `server/inngest/index.js` - `sendNewShowNotifications()`
- **Trigger**: Event `app/show.added`
- **Route/Endpoint**: Không có route trực tiếp
- **Nghiệp vụ**:
  - Nhận event `app/show.added` với data `{movieTitle, movieId}`
  - Lấy thông tin chi tiết phim từ database
  - Nếu phim không tồn tại → skip notification
  - Lấy danh sách tất cả users từ database
  - Gửi email cho tất cả users theo batch (50 users/batch):
    - Tạo URL phim: `${FRONTEND_URL}/movies/${movieId}`
    - Subject: `🎬 Phim mới: ${movie.title}`
    - Nội dung HTML bao gồm:
      - Header với logo QuickShow
      - Thông tin phim (title, tagline, overview, genres, runtime, rating)
      - Button "ĐẶT VÉ NGAY" link đến trang phim
      - Footer
  - Xử lý batch: Chia users thành các batch 50 người, gửi song song trong mỗi batch
  - Sử dụng `Promise.allSettled` để xử lý lỗi từng batch
- **Validation**: 
  - Kiểm tra phim tồn tại trước khi gửi
  - Chỉ gửi khi admin thêm phim mới lần đầu (được trigger từ `addShow()` khi `isNewMovie = true`)
- **Cách hoạt động**:
  1. Admin thêm show cho phim mới → `addShow()` trigger event `app/show.added`
  2. Function nhận event và lấy thông tin phim
  3. Lấy danh sách tất cả users
  4. Chia users thành batches 50 người
  5. Gửi email cho từng batch song song
  6. Trả về thông báo số lượng users đã nhận email
- **Response**: `{message: string}`

### 8.8. Gửi email xác nhận hủy vé

- **File**: `server/inngest/index.js` - `sendCancellationEmail()`
- **Trigger**: Event `app/booking.cancelled`
- **Route/Endpoint**: Không có route trực tiếp
- **Nghiệp vụ**:
  - Nhận event `app/booking.cancelled` với data `{bookingId}`
  - Lấy thông tin booking đầy đủ (populate show, movie, hall, user)
  - Kiểm tra booking tồn tại
  - Tạo email HTML với:
    - Header: "🎬 Hủy vé thành công"
    - Thông tin vé đã hủy:
      - Tên phim
      - Phòng chiếu
      - Suất chiếu (ngày giờ)
      - Ghế đã đặt
      - Số tiền đã thanh toán
    - Thông tin hoàn tiền:
      - Số tiền được hoàn (refundAmount)
      - Phần trăm hoàn (refundPercentage)
      - Thời gian hoàn tiền (3-5 ngày làm việc nếu đã thanh toán)
    - Chính sách hoàn vé:
      - Hủy trước 24h: Hoàn 80%
      - Hủy trước 12-24h: Hoàn 50%
      - Hủy trước 6-12h: Hoàn 20%
      - Dưới 6h: Không hoàn
    - Button "Xem phim khác" link đến trang movies
  - Gửi email với subject: `🎫 Hủy vé thành công - Hoàn ${refundPercentage}% (${refundAmount} ₫)`
- **Validation**: 
  - Kiểm tra booking tồn tại
  - Kiểm tra booking có đầy đủ thông tin (show, movie, hall, user)
- **Cách hoạt động**:
  1. User hủy vé → `cancelBooking()` trigger event `app/booking.cancelled`
  2. Function nhận event và lấy thông tin booking
  3. Tạo email HTML với thông tin hoàn tiền
  4. Gửi email cho user
  5. Trả về thông báo thành công
- **Response**: `{message: string}`

## 9. HELPER FUNCTIONS

### 9.1. Kiểm tra ghế còn trống

- **File**: `server/controllers/bookingController.js` - `checkSeatsAvailability()`
- **Function Type**: Private helper function
- **Nghiệp vụ**:
  - Nhận tham số: `showId` (string), `selectedSeats` (array of strings)
  - Lấy thông tin show từ database
  - Kiểm tra show tồn tại
  - Lấy `occupiedSeats` object từ show
  - Kiểm tra từng ghế trong `selectedSeats`:
    - Nếu ghế có trong `occupiedSeats` → ghế đã được đặt
    - Nếu tất cả ghế đều không có trong `occupiedSeats` → ghế còn trống
  - Trả về `true` nếu tất cả ghế còn trống, `false` nếu có ít nhất 1 ghế đã được đặt
- **Validation**: 
  - Trả về `false` nếu show không tồn tại
  - Trả về `false` nếu có bất kỳ ghế nào đã được đặt
- **Cách hoạt động**:
  1. Lấy show từ database
  2. Lấy object `occupiedSeats` (format: `{seatId: userId}`)
  3. Duyệt qua `selectedSeats` và kiểm tra từng ghế
  4. Sử dụng `Array.some()` để kiểm tra nhanh
  5. Trả về kết quả boolean
- **Return**: `boolean` - `true` nếu tất cả ghế còn trống, `false` nếu có ghế đã được đặt

### 9.2. Lấy số lần user đã dùng promotion

- **File**: `server/controllers/bookingController.js` - `getUserPromotionUsageCount()`
- **Function Type**: Private helper function
- **Nghiệp vụ**:
  - Nhận tham số: `userId` (string), `promotionId` (ObjectId)
  - Đếm số lượng bookings của user với promotion này:
    - `user` = userId
    - `promotionApplied` = promotionId
    - `ispaid` = true (chỉ đếm bookings đã thanh toán)
    - `status` != 'cancelled' (không đếm bookings đã hủy)
  - Trả về số lượng (number)
- **Validation**: 
  - Chỉ đếm bookings đã thanh toán
  - Không đếm bookings đã hủy
  - Xử lý lỗi: Trả về 0 nếu có lỗi
- **Cách hoạt động**:
  1. Sử dụng `Booking.countDocuments()` với query filter
  2. Filter theo user, promotion, ispaid, status
  3. Trả về số lượng
- **Return**: `number` - Số lần user đã sử dụng promotion

### 9.3. Lấy promotion tốt nhất

- **File**: `server/controllers/bookingController.js` - `getBestActivePromotion()`
- **Function Type**: Private helper function
- **Nghiệp vụ**:
  - Nhận tham số: `userId` (string)
  - Lấy thời gian hiện tại và ngày trong tuần (0=CN, 1=T2, ..., 6=T7)
  - Query promotions active:
    - `isActive` = true
    - `startDate` <= now <= `endDate`
    - `maxUsage` = 0 HOẶC `usageCount` < `maxUsage` (còn lượt sử dụng)
  - Lọc promotions có thể áp dụng:
    - Nếu `type` = 'weekly': Kiểm tra `applicableDays` có chứa ngày hôm nay không
    - Nếu `maxUsagePerUser` > 0: Kiểm tra số lần user đã dùng < `maxUsagePerUser`
  - Tìm promotion có `discountPercent` cao nhất trong danh sách applicable
  - Trả về promotion tốt nhất hoặc `null` nếu không có
- **Validation**: 
  - Promotion phải active
  - Promotion phải trong thời gian hiệu lực
  - Promotion phải còn lượt sử dụng (nếu có giới hạn)
  - Promotion weekly phải đúng ngày trong tuần
  - Promotion phải còn lượt cho user (nếu có giới hạn per user)
- **Cách hoạt động**:
  1. Query promotions active từ database
  2. Lọc theo ngày trong tuần (nếu weekly)
  3. Kiểm tra maxUsagePerUser cho từng promotion
  4. Tìm promotion có discountPercent cao nhất
  5. Trả về promotion hoặc null
- **Return**: `Promotion object | null` - Promotion tốt nhất hoặc null

### 9.4. Tính % hoàn tiền

- **File**: `server/controllers/bookingController.js` - `calculateRefundPercentage()`
- **Function Type**: Private helper function
- **Nghiệp vụ**:
  - Nhận tham số: `showDateTime` (Date)
  - Tính thời gian hiện tại (`now`)
  - Tính số giờ còn lại đến show: `(showDateTime - now) / (1000 * 60 * 60)`
  - Áp dụng chính sách hoàn tiền:
    - Nếu `hoursUntilShow >= 24`: Trả về 80%
    - Nếu `hoursUntilShow >= 12`: Trả về 50%
    - Nếu `hoursUntilShow >= 6`: Trả về 20%
    - Nếu `hoursUntilShow < 6`: Trả về 0%
  - Trả về phần trăm hoàn tiền (number)
- **Validation**: 
  - Không có validation đặc biệt
  - Hàm luôn trả về số từ 0-80
- **Cách hoạt động**:
  1. Tính số giờ còn lại (có thể âm nếu show đã qua)
  2. So sánh với các mốc thời gian (24h, 12h, 6h)
  3. Trả về phần trăm tương ứng
- **Return**: `number` - Phần trăm hoàn tiền (0, 20, 50, hoặc 80)

### 9.5. Update completed shows

- **File**: `server/controllers/showController.js` - `updateCompletedShows()`
- **Function Type**: Private helper function
- **Nghiệp vụ**:
  - Không nhận tham số (sử dụng thời gian hiện tại)
  - Tính thời gian hiện tại (`now`)
  - Tìm tất cả shows có:
    - `endDateTime` < now (show đã kết thúc)
    - `status` = 'upcoming' hoặc 'active' (chưa được đánh dấu completed)
  - Update tất cả shows này: `status` = 'completed'
  - Log số lượng shows đã update (nếu có)
  - Xử lý lỗi: Log error nhưng không throw
- **Validation**: 
  - Chỉ update shows có endDateTime < now
  - Chỉ update shows có status = 'upcoming' hoặc 'active'
  - Không update shows đã cancelled hoặc completed
- **Cách hoạt động**:
  1. Tính thời gian hiện tại
  2. Sử dụng `Show.updateMany()` với query filter
  3. Set status = 'completed' cho tất cả shows thỏa điều kiện
  4. Log kết quả
- **Return**: Không có return (void function)

## Sơ đồ luồng dữ liệu chính

### Luồng đặt vé:

```
1. User chọn ghế (Frontend)
   ↓
2. Frontend validation (tối đa 5 ghế, không để trống ghế đơn)
   ↓
3. POST /api/booking/create
   ├─ Kiểm tra ghế còn trống (checkSeatsAvailability)
   ├─ Kiểm tra hall active
   ├─ Tính giá:
   │  ├─ Base = showPrice × priceMultiplier
   │  ├─ Phụ thu ghế đôi: +10.000₫/ghế
   │  └─ Phụ thu suất tối: +10.000₫/ghế (nếu >= 17h)
   ├─ Áp dụng promotion (getBestActivePromotion)
   ├─ Tạo booking (ispaid = false)
   ├─ Chiếm giữ ghế (occupiedSeats[seat] = userId)
   ├─ Tạo Stripe Checkout Session
   └─ Trigger Inngest event: app/checkpayment
   ↓
4. Redirect user đến Stripe Checkout
   ↓
5. User thanh toán
   ↓
6. Stripe webhook: payment_intent.succeeded
   ├─ Verify signature
   ├─ Update booking: ispaid = true
   └─ Gửi email xác nhận (sendBookingConfirmationEmailDirect)
   ↓
7. Inngest: releaseSeatAndDeleteBooking (sau 10 phút)
   ├─ Kiểm tra ispaid
   ├─ Nếu false: Giải phóng ghế + Xóa booking
   └─ Nếu true: Không làm gì
```

### Luồng thêm show:

```
1. Admin chọn phim, hall, ngày giờ (Frontend)
   ↓
2. POST /api/show/add
   ├─ Validate hall tồn tại và active
   ├─ Fetch movie từ TMDB nếu chưa có
   ├─ Tính endDateTime = showDateTime + runtime + 10 phút + 20 phút
   ├─ Kiểm tra conflict:
   │  ├─ Với shows hiện có trong DB
   │  └─ Với shows trong cùng request
   ├─ Validation:
   │  ├─ Ngày show >= release_date
   │  └─ Không quá 90 ngày
   ├─ Tạo shows (insertMany)
   └─ Nếu phim mới: Trigger event app/show.added
   ↓
3. Inngest: sendNewShowNotifications
   ├─ Lấy thông tin phim
   ├─ Lấy tất cả users
   └─ Gửi email theo batch (50 users/batch)
```

### Luồng hủy vé:

```
1. User click hủy vé (Frontend)
   ↓
2. POST /api/booking/cancel/:bookingId
   ├─ Kiểm tra booking tồn tại
   ├─ Kiểm tra quyền sở hữu (userId match)
   ├─ Kiểm tra trạng thái (không cancelled)
   ├─ Kiểm tra thời gian (không hủy sau khi show bắt đầu)
   ├─ Giải phóng ghế (delete occupiedSeats)
   ├─ Nếu chưa thanh toán:
   │  └─ Xóa booking
   └─ Nếu đã thanh toán:
      ├─ Tính refundPercentage (calculateRefundPercentage)
      ├─ Nếu < 6h: Không cho hủy, hoàn lại ghế
      ├─ Tính refundAmount
      ├─ Update booking: status = cancelled
      └─ Trigger event: app/booking.cancelled
   ↓
3. Inngest: sendCancellationEmail
   ├─ Lấy thông tin booking
   └─ Gửi email với thông tin hoàn tiền
```

## Validation Rules tổng hợp

### 1. Hall Validation
- **Tạo show**: Hall phải `status = 'active'` (không maintenance, không inactive)
- **Tạo booking**: Hall phải `status = 'active'`
- **Xóa hall**: Không được xóa nếu có shows tương lai
- **Unique constraints**: `hallNumber` và `name` phải unique

### 2. Show Validation
- **Thêm show**: 
  - Không conflict thời gian với shows hiện có
  - Không conflict trong cùng request
  - Ngày show >= ngày khởi chiếu phim (`release_date`)
  - Không tạo show quá 90 ngày trong tương lai
  - Hall phải active
- **Conflict detection**: 
  - Show mới bắt đầu khi show cũ đang chiếu
  - Show mới kết thúc khi show cũ đang chiếu
  - Show mới bọc hoàn toàn show cũ
- **Status update**: Tự động update `completed` khi `endDateTime < now`

### 3. Booking Validation
- **Tạo booking**:
  - Ghế phải còn trống (không có trong `occupiedSeats`)
  - Hall phải active
  - Promotion phải active, trong thời gian, còn lượt
  - Promotion weekly: đúng ngày trong tuần
  - Promotion maxUsagePerUser: user chưa dùng hết lượt
- **Hủy booking**:
  - User phải là chủ sở hữu
  - Không hủy sau khi show bắt đầu
  - Không hủy nếu < 6h (đã thanh toán)

### 4. Promotion Validation
- **Áp dụng promotion**:
  - `isActive` = true
  - `startDate` <= now <= `endDate`
  - `usageCount` < `maxUsage` (nếu maxUsage > 0)
  - `type = 'weekly'`: `applicableDays` includes today
  - `maxUsagePerUser` > 0: User usage count < maxUsagePerUser
- **Tạo promotion**:
  - Required: name, discountPercent, startDate, endDate
  - `startDate` < `endDate`
  - `discountPercent`: 0-100

### 5. User Validation
- **Tự động tạo**: Tự động tạo từ Clerk nếu chưa có trong MongoDB
- **Sync**: Đồng bộ với Clerk qua Inngest events

### 6. Refund Policy
- **Chính sách hoàn tiền**:
  - Hủy trước 24h: Hoàn 80%
  - Hủy trước 12-24h: Hoàn 50%
  - Hủy trước 6-12h: Hoàn 20%
  - Dưới 6h: Không hoàn (không cho hủy)
- **Áp dụng**: Chỉ cho bookings đã thanh toán (`ispaid = true`)

## File Structure Summary

### Models
- `server/models/User.js` - User schema với favoriteMovies
- `server/models/Movie.js` - Movie schema với thông tin từ TMDB
- `server/models/Show.js` - Show schema với occupiedSeats, status
- `server/models/Booking.js` - Booking schema với promotion, refund info
- `server/models/CinemaHall.js` - CinemaHall schema với seatLayout, status
- `server/models/Promotion.js` - Promotion schema với banner, usage limits

### Controllers
- `server/controllers/userController.js` - User operations (bookings, favorites)
- `server/controllers/adminController.js` - Admin operations (dashboard, shows, bookings, users)
- `server/controllers/showController.js` - Show operations (add, get, search, genres)
- `server/controllers/bookingController.js` - Booking operations (create, cancel, seats)
- `server/controllers/cinemaHallController.js` - Cinema hall operations (CRUD, statistics)
- `server/controllers/promotionController.js` - Promotion operations (CRUD, active promotions)
- `server/controllers/stripeWebhooks.js` - Stripe webhook handler

### Routes
- `server/routes/userRoutes.js` - User API routes
- `server/routes/adminRoutes.js` - Admin API routes
- `server/routes/showRoutes.js` - Show API routes
- `server/routes/bookingRoutes.js` - Booking API routes
- `server/routes/cinemaHallRoutes.js` - Cinema hall API routes
- `server/routes/promotionRoutes.js` - Promotion API routes

### Middleware
- `server/middleware/auth.js` - Authentication middleware (protectAdmin)

### Background Jobs
- `server/inngest/index.js` - Inngest functions:
  - `syncUserCreation` - Sync user từ Clerk
  - `syncUserUpdation` - Update user từ Clerk
  - `syncUserDeletion` - Delete user từ Clerk
  - `releaseSeatAndDeleteBooking` - Tự động hủy booking chưa thanh toán
  - `sendBookingConfirmationEmail` - Gửi email xác nhận (không dùng)
  - `sendShowReminders` - Gửi email nhắc nhở
  - `sendNewShowNotifications` - Gửi email thông báo phim mới
  - `sendCancellationEmail` - Gửi email xác nhận hủy vé

### Configuration
- `server/configs/db.js` - MongoDB connection
- `server/configs/nodeMailer.js` - Email configuration
- `server/server.js` - Express server setup và route registration

## Constants và Configuration

### Price Constants
- `COUPLE_SEAT_SURCHARGE = 10000` (VNĐ) - Phụ thu ghế đôi
- `EVENING_SURCHARGE = 10000` (VNĐ) - Phụ thu suất tối (>= 17h)
- `BUFFER_TIME = 10` (phút) - Thời gian buffer giữa các suất
- `CLEANING_TIME = 20` (phút) - Thời gian vệ sinh phòng

### Time Constants
- `MAX_DAYS_AHEAD = 90` (ngày) - Giới hạn tạo show trong tương lai
- `PAYMENT_TIMEOUT = 10` (phút) - Thời gian chờ thanh toán
- `STRIPE_SESSION_EXPIRES = 10` (phút) - Thời gian hết hạn Stripe session
- `REMINDER_HOURS = 3` (giờ) - Thời gian gửi email nhắc nhở trước khi chiếu

### Refund Percentages
- `REFUND_24H = 80` (%) - Hoàn 80% nếu hủy trước 24h
- `REFUND_12H = 50` (%) - Hoàn 50% nếu hủy trước 12-24h
- `REFUND_6H = 20` (%) - Hoàn 20% nếu hủy trước 6-12h
- `REFUND_MIN = 0` (%) - Không hoàn nếu hủy dưới 6h

### Batch Sizes
- `EMAIL_BATCH_SIZE = 50` - Số lượng users gửi email mỗi batch

## Error Handling

### Common Error Patterns
1. **Validation Errors**: Trả về `{success: false, message: 'Error message'}`
2. **Not Found**: Trả về `{success: false, message: 'Không tìm thấy...'}`
3. **Unauthorized**: Trả về `{success: false, message: 'Access denied...'}`
4. **Conflict**: Trả về `{success: false, message: 'Conflict...', conflicts: [...]}`
5. **Database Errors**: Log error và trả về generic message

### Error Response Format
```json
{
  "success": false,
  "message": "Error message in Vietnamese"
}
```

### Success Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Success message (optional)"
}
```

---

*Tài liệu này mô tả chi tiết toàn bộ nghiệp vụ, logic, validation và cách thức hoạt động của hệ thống đặt vé xem phim từ phần 8.4 trở đi.*

