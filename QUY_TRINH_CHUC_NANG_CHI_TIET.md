# 📋 QUY TRÌNH THỰC HIỆN CÁC CHỨC NĂNG CHÍNH

## 🎯 TỔNG QUAN

Tài liệu này mô tả chi tiết quy trình thực hiện từng chức năng chính trong hệ thống đặt vé xem phim, bao gồm các bước cụ thể, luồng dữ liệu, và các điều kiện kiểm tra.

---

## 👤 **CHỨC NĂNG NGƯỜI DÙNG**

### 1. **ĐĂNG KÝ VÀ ĐĂNG NHẬP**

#### 1.1. Đăng ký tài khoản

**Quy trình:**

```
Bước 1: User truy cập trang web
  └─> Click nút "Đăng ký" (Sign Up)

Bước 2: Clerk Authentication UI hiển thị
  ├─> User nhập email
  ├─> User nhập password
  └─> User xác nhận email (nếu cần)

Bước 3: Clerk xử lý đăng ký
  ├─> Tạo user trong Clerk
  ├─> Gửi email xác nhận (nếu cần)
  └─> Tạo session

Bước 4: Clerk Webhook gửi event
  └─> Event: "clerk/user.created"
      ├─> Data: {id, first_name, last_name, email_addresses, image_url}
      └─> Gửi đến Inngest

Bước 5: Inngest Function xử lý
  └─> Function: "sync-user-from-clerk"
      ├─> Lấy thông tin từ event.data
      ├─> Tạo User document trong MongoDB
      │   ├─> _id: Clerk user ID
      │   ├─> name: first_name + last_name
      │   ├─> email: email_addresses[0]
      │   └─> image: image_url
      └─> Lưu vào database

Bước 6: Frontend nhận callback
  └─> Redirect về trang chủ
      └─> User đã đăng nhập thành công
```

**Điều kiện kiểm tra:**
- Email phải hợp lệ và chưa tồn tại
- Password phải đủ mạnh (theo policy của Clerk)
- Email xác nhận (nếu bật)

**Kết quả:**
- User được tạo trong Clerk
- User được đồng bộ vào MongoDB
- Session được tạo
- User tự động đăng nhập

---

#### 1.2. Đăng nhập

**Quy trình:**

```
Bước 1: User truy cập trang web
  └─> Click nút "Đăng nhập" (Sign In)

Bước 2: Clerk Authentication UI hiển thị
  ├─> User nhập email/password
  └─> Hoặc đăng nhập bằng OAuth (Google, Facebook)

Bước 3: Clerk xác thực
  ├─> Kiểm tra credentials
  ├─> Tạo session
  └─> Trả về JWT token

Bước 4: Frontend lưu session
  ├─> Clerk SDK lưu session
  └─> Lấy token: getToken()

Bước 5: Frontend gọi API với token
  └─> Header: Authorization: Bearer <token>
```

**Điều kiện kiểm tra:**
- Email và password phải đúng
- Account phải active (không bị khóa)

**Kết quả:**
- Session được tạo
- User đăng nhập thành công
- Token được lưu trong Clerk session

---

### 2. **XEM DANH SÁCH PHIM VÀ CHI TIẾT PHIM**

#### 2.1. Xem danh sách phim đang chiếu

**Quy trình:**

```
Bước 1: User truy cập trang "Phim" (/movies)
  └─> Frontend gọi API: GET /api/show/all

Bước 2: Backend xử lý
  ├─> Query Show collection:
  │   ├─> showDateTime >= hiện tại
  │   └─> Populate movie
  ├─> Group theo movie (unique)
  └─> Sort theo showDateTime

Bước 3: Trả về danh sách
  └─> Response: {success: true, shows: [Movie objects]}

Bước 4: Frontend hiển thị
  ├─> Grid layout với MovieCard components
  ├─> Hiển thị poster, title, rating
  └─> Click vào phim → Navigate đến /movies/:id
```

**Dữ liệu trả về:**
- Danh sách Movie unique (chỉ phim có suất chiếu sắp tới)
- Thông tin: _id, title, poster_path, vote_average

---

#### 2.2. Xem chi tiết phim

**Quy trình:**

```
Bước 1: User click vào phim
  └─> Navigate đến /movies/:movieId

Bước 2: Frontend gọi API
  └─> GET /api/show/:movieId

Bước 3: Backend xử lý
  ├─> Tìm Movie trong DB theo movieId
  │   └─> Nếu chưa có → Fetch từ TMDB API
  │       ├─> GET /movie/{id} (details)
  │       ├─> GET /movie/{id}/credits (casts)
  │       └─> GET /movie/{id}/videos (trailer)
  ├─> Tìm tất cả Shows sắp tới của phim
  │   ├─> showDateTime >= hiện tại
  │   └─> Populate hall
  ├─> Filter shows trong phòng active
  ├─> Group shows theo ngày
  └─> Tính giá hiển thị (basePrice × priceMultiplier)

Bước 4: Trả về dữ liệu
  └─> Response: {
        success: true,
        movie: {...},
        dateTime: {
          "2025-12-25": [
            {
              time: Date,
              showId: String,
              showPrice: Number,
              isEveningShow: Boolean,
              hall: {...}
            }
          ]
        }
      }

Bước 5: Frontend hiển thị
  ├─> Poster, title, overview, genres, casts
  ├─> Lịch chiếu group theo ngày
  ├─> DateSelect component để chọn ngày
  ├─> Danh sách suất chiếu theo giờ
  └─> Button "Mua vé" → Navigate đến /seat-layout/:showId/:date
```

**Điều kiện kiểm tra:**
- Movie phải tồn tại (trong DB hoặc TMDB)
- Phải có ít nhất 1 show sắp tới
- Hall phải active (không maintenance)

---

### 3. **ĐẶT VÉ VÀ THANH TOÁN**

#### 3.1. Chọn ghế ngồi

**Quy trình:**

```
Bước 1: User chọn suất chiếu
  └─> Click "Mua vé" → Navigate đến /seat-layout/:showId/:date

Bước 2: Frontend load sơ đồ ghế
  ├─> Gọi API: GET /api/booking/seats/:showId
  └─> Backend trả về: {occupiedSeats: ["A1", "A2", ...]}

Bước 3: Frontend hiển thị sơ đồ
  ├─> Lấy thông tin hall từ show
  │   ├─> seatLayout.rows: ["A", "B", "C", ...]
  │   ├─> seatLayout.seatsPerRow: 9
  │   ├─> seatLayout.coupleSeatsRows: ["H", "J"]
  │   └─> brokenSeats: ["C5", "D3"]
  ├─> Render sơ đồ ghế
  │   ├─> Ghế trống: màu xanh, clickable
  │   ├─> Ghế đã đặt: màu đỏ, disabled
  │   ├─> Ghế hỏng: màu xám, disabled
  │   └─> Ghế đôi: highlight đặc biệt
  └─> Hiển thị sidebar với thông tin show

Bước 4: User chọn ghế
  ├─> Click vào ghế trống
  │   ├─> Nếu ghế đôi: Tự động chọn 2 ghế liền kề
  │   └─> Nếu ghế thường: Chọn 1 ghế
  ├─> Validation frontend:
  │   ├─> Tối đa 5 ghế
  │   ├─> Không để trống 1 ghế bên trái
  │   ├─> Không để trống 1 ghế bên phải
  │   └─> Không để trống 1 ghế ở giữa
  └─> Hiển thị tổng tiền (tính realtime)

Bước 5: User click "Thanh toán"
  └─> Gọi API: POST /api/booking/create
```

**Validation Rules:**
- Tối đa 5 ghế mỗi booking
- Không được để trống đúng 1 ghế đơn (ràng buộc ghế)
- Ghế đôi: Click 1 ghế → Tự chọn 2 ghế liền kề

---

#### 3.2. Tạo booking và thanh toán

**Quy trình:**

```
Bước 1: Frontend gửi request
  └─> POST /api/booking/create
      Body: {
        showId: String,
        selectedSeats: ["A1", "A2"]
      }
      Headers: {
        Authorization: Bearer <token>,
        Origin: http://localhost:5173
      }

Bước 2: Backend kiểm tra ghế còn trống
  ├─> Lấy Show từ DB
  ├─> Kiểm tra occupiedSeats
  └─> Nếu ghế đã bị đặt → Trả về lỗi

Bước 3: Kiểm tra phòng chiếu
  ├─> Lấy hall từ show
  └─> Nếu hall.status !== 'active' → Trả về lỗi

Bước 4: Tính giá vé
  ├─> basePrice = showPrice × hall.priceMultiplier
  ├─> Với mỗi ghế:
  │   ├─> seatPrice = basePrice
  │   ├─> Nếu ghế đôi: +10.000₫
  │   └─> Nếu suất tối (>= 17h): +10.000₫
  └─> totalAmount = tổng seatPrice

Bước 5: Tạo Booking
  └─> Booking.create({
        user: userId,
        show: showId,
        amount: totalAmount,
        bookedSeats: selectedSeats,
        ispaid: false
      })

Bước 6: Chiếm giữ ghế
  ├─> Với mỗi ghế trong selectedSeats:
  │   └─> show.occupiedSeats[seat] = userId
  ├─> show.markModified('occupiedSeats')
  └─> show.save()

Bước 7: Tạo Stripe Checkout Session
  ├─> stripe.checkout.sessions.create({
        success_url: `${origin}/loading/my-bookings`,
        cancel_url: `${origin}/my-bookings`,
        line_items: [{
          price_data: {
            currency: 'vnd',
            product_data: { name: movie.title },
            unit_amount: totalAmount
          },
          quantity: 1
        }],
        mode: 'payment',
        metadata: { bookingId: booking._id },
        expires_at: now + 30 minutes
      })
  └─> Lưu paymentLink vào booking

Bước 8: Trigger Inngest event
  └─> inngest.send({
        name: "app/checkpayment",
        data: { bookingId: booking._id }
      })
      → Để kiểm tra thanh toán sau 10 phút

Bước 9: Trả về payment URL
  └─> Response: {success: true, url: stripeCheckoutUrl}

Bước 10: Frontend redirect
  └─> window.location.href = stripeCheckoutUrl
      → User chuyển đến Stripe Checkout
```

**Điều kiện kiểm tra:**
- Ghế phải còn trống
- Phòng chiếu phải active
- User phải đã đăng nhập
- Tối đa 5 ghế

---

#### 3.3. Thanh toán trên Stripe

**Quy trình:**

```
Bước 1: User ở Stripe Checkout
  ├─> Nhập thông tin thẻ
  │   ├─> Số thẻ
  │   ├─> Ngày hết hạn
  │   ├─> CVV
  │   └─> Tên chủ thẻ
  └─> Click "Thanh toán"

Bước 2: Stripe xử lý thanh toán
  ├─> Kiểm tra thẻ hợp lệ
  ├─> Xử lý payment
  └─> Tạo payment_intent

Bước 3: Stripe gửi webhook
  └─> POST /api/booking/stripe-webhook
      Event: "payment_intent.succeeded"
      Headers: {
        stripe-signature: <signature>
      }
      Body: Raw webhook payload

Bước 4: Backend verify webhook
  ├─> Verify signature với STRIPE_WEBHOOK_SECRET
  └─> Parse event

Bước 5: Xử lý event
  ├─> Lấy payment_intent từ event
  ├─> Tìm checkout session từ payment_intent
  ├─> Lấy bookingId từ session.metadata
  └─> Cập nhật booking:
      ├─> ispaid = true
      └─> paymentLink = ""

Bước 6: Trigger Inngest gửi email
  └─> inngest.send({
        name: "app/show.booked",
        data: { bookingId }
      })

Bước 7: User redirect về success URL
  └─> /loading/my-bookings
      → Hiển thị thông báo thành công
      → Redirect đến /my-bookings
```

**Điều kiện kiểm tra:**
- Webhook signature phải hợp lệ
- Payment phải thành công
- Booking phải tồn tại

---

#### 3.4. Gửi email xác nhận đặt vé

**Quy trình:**

```
Bước 1: Inngest nhận event
  └─> Event: "app/show.booked"
      Data: { bookingId }

Bước 2: Inngest Function chạy
  └─> Function: "send-booking-confirmation-email"

Bước 3: Lấy thông tin booking
  ├─> Booking.findById(bookingId)
  ├─> Populate show → movie, hall
  └─> Populate user

Bước 4: Tạo QR Code
  ├─> QR data: JSON.stringify({
        bookingId,
        userId,
        showId,
        seats: bookedSeats
      })
  ├─> QRCode.toBuffer(qrData, {...})
  └─> Convert to base64

Bước 5: Format email
  ├─> Thông tin phim: title, runtime, genres
  ├─> Thông tin suất chiếu: date, time, hall
  ├─> Thông tin booking: bookingId, seats, amount
  └─> QR code đính kèm

Bước 6: Gửi email
  └─> sendEmail({
        to: user.email,
        subject: `🎬 Xác nhận đặt vé - ${movie.title}`,
        body: HTML email template,
        attachments: [{name: 'qrcode.png', content: qrCodeBase64}]
      })

Bước 7: User nhận email
  └─> Email với QR code đính kèm
      → Dùng để check-in tại rạp
```

---

### 4. **HỦY VÉ**

#### 4.1. Hủy vé chưa thanh toán

**Quy trình:**

```
Bước 1: User vào trang "Vé đặt của tôi"
  └─> /my-bookings

Bước 2: User click "Hủy vé"
  └─> Gọi API: POST /api/booking/cancel/:bookingId

Bước 3: Backend kiểm tra
  ├─> Tìm booking
  ├─> Kiểm tra quyền sở hữu (user._id === userId)
  ├─> Kiểm tra trạng thái (status !== 'cancelled')
  └─> Kiểm tra thời gian (showDateTime > now)

Bước 4: Giải phóng ghế
  ├─> Lấy Show từ booking
  ├─> Với mỗi ghế trong bookedSeats:
  │   └─> delete show.occupiedSeats[seat]
  └─> show.save()

Bước 5: Xóa booking
  └─> Booking.findByIdAndDelete(bookingId)

Bước 6: Trả về kết quả
  └─> Response: {success: true, message: "Hủy vé thành công"}
```

---

#### 4.2. Hủy vé đã thanh toán

**Quy trình:**

```
Bước 1-3: Tương tự hủy vé chưa thanh toán

Bước 4: Tính hoàn tiền
  ├─> Tính hoursUntilShow = (showDateTime - now) / (1000 * 60 * 60)
  ├─> Nếu >= 24h: refundPercentage = 80%
  ├─> Nếu >= 12h: refundPercentage = 50%
  ├─> Nếu >= 6h: refundPercentage = 20%
  └─> Nếu < 6h: refundPercentage = 0% (không cho hủy)

Bước 5: Cập nhật booking
  ├─> booking.status = 'cancelled'
  ├─> booking.cancelledAt = new Date()
  ├─> booking.refundPercentage = refundPercentage
  └─> booking.refundAmount = (amount × refundPercentage) / 100

Bước 6: Giải phóng ghế
  └─> Tương tự bước 4 của hủy vé chưa thanh toán

Bước 7: Trigger Inngest gửi email
  └─> inngest.send({
        name: "app/booking.cancelled",
        data: { bookingId }
      })

Bước 8: Trả về kết quả
  └─> Response: {
        success: true,
        message: `Hủy vé thành công. Hoàn ${refundPercentage}%`,
        refundPercentage,
        refundAmount
      }
```

**Chính sách hoàn tiền:**
- Trước 24h: Hoàn 80%
- Trước 12-24h: Hoàn 50%
- Trước 6-12h: Hoàn 20%
- Dưới 6h: Không hoàn (không cho hủy)

---

### 5. **YÊU THÍCH PHIM**

#### 5.1. Thêm/xóa phim yêu thích

**Quy trình:**

```
Bước 1: User click icon Heart trên MovieDetails
  └─> Gọi API: POST /api/user/update-favorite
      Body: { movieId }

Bước 2: Backend xử lý
  ├─> Lấy user từ MongoDB
  ├─> Kiểm tra movieId có trong favoriteMovies không
  │   ├─> Nếu có: Xóa khỏi array
  │   └─> Nếu không: Thêm vào array
  │       ├─> Kiểm tra movie có trong DB không
  │       │   └─> Nếu chưa có: Fetch từ TMDB và lưu
  │       └─> user.favoriteMovies.push(movieId)
  └─> user.save()

Bước 3: Trả về kết quả
  └─> Response: {
        success: true,
        message: "Đã thêm vào yêu thích" hoặc "Đã hủy yêu thích"
      }

Bước 4: Frontend cập nhật UI
  └─> Toggle icon Heart (filled/outline)
```

---

## 👨‍💼 **CHỨC NĂNG QUẢN TRỊ VIÊN**

### 1. **THÊM SUẤT CHIẾU MỚI**

**Quy trình:**

```
Bước 1: Admin truy cập trang "Thêm suất chiếu"
  └─> /admin/add-shows

Bước 2: Admin lấy danh sách phim từ TMDB
  └─> Frontend gọi: GET /api/show/now-playing
      → Backend fetch từ TMDB API
      → Trả về danh sách phim với runtime và genres

Bước 3: Admin chọn phim
  └─> Click vào phim từ danh sách

Bước 4: Admin nhập thông tin
  ├─> Chọn phòng chiếu (dropdown)
  ├─> Nhập giá vé cơ bản
  └─> Thêm nhiều ngày-giờ chiếu
      ├─> Chọn ngày (date picker)
      └─> Nhập các giờ chiếu (ví dụ: 10:00, 14:00, 18:00)

Bước 5: Admin click "Thêm suất chiếu"
  └─> Frontend gọi: POST /api/show/add
      Body: {
        movieId: String,
        hallId: String,
        showPrice: Number,
        showsInput: [
          {
            date: "2025-12-25",
            time: ["10:00", "14:00", "18:00"]
          }
        ]
      }

Bước 6: Backend kiểm tra phim
  ├─> Tìm Movie trong DB
  │   └─> Nếu chưa có:
  │       ├─> Fetch từ TMDB (details, credits, videos)
  │       └─> Tạo Movie record mới
  └─> Lấy movieReleaseDate

Bước 7: Backend kiểm tra xung đột (Conflict Detection)
  ├─> Với mỗi date-time:
  │   ├─> Tính endDateTime = showDateTime + (runtime + 10 + 20) phút
  │   ├─> Kiểm tra xung đột với shows trong DB:
  │   │   └─> Query Show.find({
  │   │         hall: hallId,
  │   │         $or: [
  │   │           { showDateTime <= newStart && endDateTime > newStart },
  │   │           { showDateTime < newEnd && endDateTime >= newEnd },
  │   │           { showDateTime >= newStart && endDateTime <= newEnd }
  │   │         ]
  │   │       })
  │   ├─> Kiểm tra xung đột trong cùng request
  │   └─> Kiểm tra ngày show >= ngày khởi chiếu phim
  └─> Nếu có xung đột: Trả về lỗi với danh sách conflicts

Bước 8: Tạo các Show records
  ├─> Với mỗi date-time không xung đột:
  │   └─> Tạo Show document:
  │       ├─> movie: movieId
  │       ├─> hall: hallId
  │       ├─> showDateTime: Date
  │       ├─> endDateTime: Date
  │       ├─> showPrice: Number
  │       └─> occupiedSeats: {}
  └─> Show.insertMany(showsToCreate)

Bước 9: Trigger email thông báo (nếu phim mới)
  └─> Nếu isNewMovie:
      └─> inngest.send({
            name: "app/show.added",
            data: { movieTitle, movieId }
          })

Bước 10: Trả về kết quả
  └─> Response: {
        success: true,
        message: `Đã thêm ${count} suất chiếu thành công`
      }
```

**Conflict Detection Logic:**
- Tính thời gian kết thúc: `runtime + 10 phút buffer + 20 phút vệ sinh`
- Kiểm tra 3 trường hợp xung đột:
  1. Show mới bắt đầu khi show cũ đang chiếu
  2. Show mới kết thúc khi show cũ đang chiếu
  3. Show mới bọc hoàn toàn show cũ

---

### 2. **QUẢN LÝ PHÒNG CHIẾU**

#### 2.1. Tạo phòng chiếu mới

**Quy trình:**

```
Bước 1: Admin truy cập trang "Quản lý phòng chiếu"
  └─> /admin/list-cinema-halls

Bước 2: Admin click "Tạo phòng mới"
  └─> Mở modal AddEditCinemaHallModal

Bước 3: Admin nhập thông tin
  ├─> Tên phòng: "Phòng 1 - Standard"
  ├─> Số phòng: 1
  ├─> Loại phòng: Standard/VIP/IMAX
  ├─> Tổng số ghế: 90
  ├─> Sơ đồ ghế:
  │   ├─> Rows: ["A", "B", "C", ...]
  │   ├─> Seats per row: 9
  │   └─> Couple seats rows: ["H", "J"]
  ├─> Hệ số giá: 1.0 (Standard), 1.5 (VIP), 2.0 (IMAX)
  └─> Trạng thái: active

Bước 4: Admin click "Lưu"
  └─> Frontend gọi: POST /api/hall/create
      Body: {
        name, hallNumber, type, totalSeats,
        seatLayout, priceMultiplier, status
      }

Bước 5: Backend kiểm tra
  ├─> Kiểm tra hallNumber chưa tồn tại
  └─> Tạo CinemaHall document

Bước 6: Trả về kết quả
  └─> Response: {success: true, message: "Tạo phòng chiếu thành công"}
```

---

#### 2.2. Cập nhật phòng chiếu

**Quy trình:**

```
Bước 1: Admin click "Chỉnh sửa" trên phòng chiếu
  └─> Mở modal với dữ liệu hiện tại

Bước 2: Admin chỉnh sửa thông tin
  └─> Có thể cập nhật tất cả fields

Bước 3: Admin click "Lưu"
  └─> Frontend gọi: PUT /api/hall/:hallId
      Body: {updates}

Bước 4: Backend kiểm tra
  ├─> Nếu cập nhật hallNumber: Kiểm tra chưa tồn tại
  └─> CinemaHall.findByIdAndUpdate(hallId, updates)

Bước 5: Trả về kết quả
  └─> Response: {success: true, message: "Cập nhật thành công"}
```

---

#### 2.3. Chuyển đổi trạng thái phòng

**Quy trình:**

```
Bước 1: Admin click "Bảo trì" hoặc "Kích hoạt"
  └─> Mở modal chuyển đổi trạng thái

Bước 2: Admin chọn trạng thái
  ├─> active: Phòng hoạt động bình thường
  ├─> maintenance: Phòng đang bảo trì
  │   ├─> Nhập lý do bảo trì
  │   ├─> Ngày bắt đầu bảo trì
  │   └─> Ngày kết thúc bảo trì (dự kiến)
  └─> inactive: Phòng không hoạt động

Bước 3: Admin click "Xác nhận"
  └─> Frontend gọi: PATCH /api/hall/:hallId/status
      Body: {
        status: "maintenance",
        maintenanceNote: "Sửa chữa hệ thống âm thanh",
        maintenanceStartDate: Date,
        maintenanceEndDate: Date
      }

Bước 4: Backend cập nhật
  └─> CinemaHall.findByIdAndUpdate(hallId, updates)

Bước 5: Ảnh hưởng
  └─> Shows trong phòng maintenance sẽ không hiển thị
      → User không thể đặt vé phòng đang bảo trì
```

---

## 🔄 **CHỨC NĂNG HỆ THỐNG (BACKGROUND JOBS)**

### 1. **TỰ ĐỘNG HỦY BOOKING CHƯA THANH TOÁN**

**Quy trình:**

```
Bước 1: Booking được tạo
  └─> createBooking() trigger event:
      └─> inngest.send({
            name: "app/checkpayment",
            data: { bookingId }
          })

Bước 2: Inngest Function nhận event
  └─> Function: "release-seats-delete-booking"

Bước 3: Đợi 10 phút
  └─> step.sleepUntil('wait-for-10-minutes', now + 10 minutes)

Bước 4: Kiểm tra trạng thái thanh toán
  └─> step.run("check-payment-status", async () => {
        const booking = await Booking.findById(bookingId);
        
        if (!booking.ispaid) {
          // Chưa thanh toán → Hủy booking
          const show = await Show.findById(booking.show);
          
          // Giải phóng ghế
          booking.bookedSeats.forEach(seat => {
            delete show.occupiedSeats[seat];
          });
          show.markModified('occupiedSeats');
          await show.save();
          
          // Xóa booking
          await Booking.findByIdAndDelete(bookingId);
        }
        // Nếu đã thanh toán → Không làm gì
      })
```

**Mục đích:**
- Tránh ghế bị "đóng băng" khi user không thanh toán
- Tự động giải phóng ghế sau 10 phút

---

### 2. **GỬI EMAIL NHẮC NHỞ TRƯỚC KHI CHIẾU**

**Quy trình:**

```
Bước 1: Cron job chạy mỗi 1 giờ
  └─> Inngest cron: "0 */1 * * *"
      Function: "send-show-reminders"

Bước 2: Tìm shows sẽ chiếu trong 3 giờ tới
  └─> const now = new Date();
      const in3Hours = new Date(now + 3 hours);
      
      Show.find({
        showDateTime: {$gte: now, $lt: in3Hours}
      })

Bước 3: Lấy danh sách users đã đặt vé
  ├─> Với mỗi show:
  │   ├─> Lấy userIds từ occupiedSeats
  │   └─> User.find({_id: {$in: userIds}})
  └─> Tạo tasks: [{userEmail, userName, movieTitle, showTime}]

Bước 4: Gửi email nhắc nhở
  └─> Với mỗi task:
      └─> sendEmail({
            to: userEmail,
            subject: `Nhắc nhở: Phim "${movieTitle}" sắp bắt đầu!`,
            body: HTML template với thông tin phim và thời gian
          })

Bước 5: Trả về kết quả
  └─> {sent: count, failed: count, message: "..."}
```

**Mục đích:**
- Nhắc nhở user trước 3 giờ để không quên
- Tăng tỷ lệ đến rạp đúng giờ

---

### 3. **GỬI EMAIL THÔNG BÁO PHIM MỚI**

**Quy trình:**

```
Bước 1: Admin thêm phim mới
  └─> addShow() trigger event (nếu isNewMovie):
      └─> inngest.send({
            name: "app/show.added",
            data: { movieTitle, movieId }
          })

Bước 2: Inngest Function nhận event
  └─> Function: "send-new-show-notifications"

Bước 3: Lấy thông tin phim
  └─> Movie.findById(movieId)

Bước 4: Lấy tất cả users
  └─> User.find({})

Bước 5: Gửi email theo batch
  ├─> Chia users thành batch 50 người
  ├─> Với mỗi batch:
  │   └─> step.run(`send-batch-${i}`, async () => {
  │         await Promise.allSettled(
  │           batch.map(user => sendEmail({
  │             to: user.email,
  │             subject: `🎬 Phim mới: ${movie.title}`,
  │             body: HTML template với poster, overview, link đặt vé
  │           }))
  │         )
  │       })
  └─> Tránh quá tải server

Bước 6: Trả về kết quả
  └─> {message: `Đã gửi thông báo cho ${users.length} người dùng`}
```

**Mục đích:**
- Thông báo phim mới cho tất cả users
- Tăng doanh thu và engagement

---

## 📊 **TỔNG KẾT**

### Các điểm quan trọng trong quy trình:

1. **Chiếm giữ ghế ngay lập tức**: Khi tạo booking, ghế được chiếm ngay để tránh race condition
2. **Tự động hủy sau 10 phút**: Nếu không thanh toán, booking tự động bị hủy
3. **Conflict Detection**: Tự động phát hiện xung đột lịch chiếu
4. **Dynamic Pricing**: Tính giá theo loại phòng, ghế đôi, suất tối
5. **Email Automation**: 4 loại email tự động (xác nhận, nhắc nhở, thông báo, hủy vé)
6. **QR Code**: Tạo QR code cho check-in tại rạp

---

*Tài liệu này mô tả chi tiết quy trình thực hiện các chức năng chính trong hệ thống đặt vé xem phim.*

