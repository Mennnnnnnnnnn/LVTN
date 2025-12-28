# 📋 TÀI LIỆU NGHIỆP VỤ CHI TIẾT - CHUẨN BỊ PHẢN BIỆN

## 🎯 TỔNG QUAN HỆ THỐNG

**Tên dự án:** Hệ thống đặt vé xem phim trực tuyến (Movie Ticket Booking System)

**Mô tả:** Ứng dụng web fullstack cho phép người dùng xem thông tin phim, đặt vé trực tuyến, thanh toán qua Stripe và quản trị viên quản lý toàn bộ hệ thống rạp chiếu phim.

---

## 👥 CÁC ACTOR TRONG HỆ THỐNG

### 1. **Người dùng (User/Customer)**
- Khách hàng muốn đặt vé xem phim
- Cần đăng nhập để thực hiện các chức năng chính
- Có thể xem phim mà không cần đăng nhập

### 2. **Quản trị viên (Admin)**
- Nhân viên rạp chiếu phim
- Quản lý suất chiếu, xem báo cáo
- Có quyền truy cập cao hơn user thường

### 3. **Hệ thống bên ngoài**
- **TMDB API:** Cung cấp dữ liệu phim
- **Stripe:** Xử lý thanh toán
- **Clerk:** Xác thực người dùng
- **Brevo:** Gửi email
- **Inngest:** Xử lý background jobs

---

## 📚 CHỨC NĂNG NGƯỜI DÙNG - CHI TIẾT

### 1. 🔐 ĐĂNG KÝ / ĐĂNG NHẬP

**Nghiệp vụ:**
- Sử dụng Clerk Authentication (OAuth, Email/Password)
- Người dùng có thể đăng nhập bằng: Google, Email

**Luồng xử lý:**
```
1. User click "Đăng nhập"
2. Chuyển hướng đến Clerk UI
3. User nhập thông tin hoặc chọn OAuth
4. Clerk xác thực → Tạo session
5. Clerk webhook → Inngest đồng bộ user vào MongoDB
6. Frontend nhận token → Lưu vào context
7. Redirect về trang trước đó
```

**Ràng buộc:**
- ✅ Email phải unique trong hệ thống
- ✅ Session hết hạn sau 7 ngày (Clerk config)
- ✅ Không lưu password trong database (Clerk quản lý)

**Xử lý lỗi:**
- Email đã tồn tại → Clerk báo lỗi
- OAuth failed → Hiển thị toast error
- Network error → Retry mechanism

---

### 2. 🎬 XEM DANH SÁCH PHIM

**Nghiệp vụ:**
- Hiển thị tất cả phim có suất chiếu trong tương lai
- Không yêu cầu đăng nhập

**API:** `GET /api/show/all`

**Luồng xử lý:**
```
1. Frontend gọi API
2. Backend query Shows có showDateTime >= NOW
3. Populate thông tin Movie
4. Group theo movie._id (loại bỏ duplicate)
5. Sort theo vote_average DESC
6. Return array movies
```

**Dữ liệu trả về:**
```json
{
  "success": true,
  "shows": [
    {
      "_id": "show_id",
      "movie": {
        "_id": "83533",
        "title": "Avatar: Fire and Ash",
        "poster_path": "/path.jpg",
        "vote_average": 7.4,
        ...
      },
      "dateTime": {
        "2025-12-25": ["11:00", "14:00", "17:00"],
        "2025-12-26": ["10:00", "13:00"]
      }
    }
  ]
}
```

**Ràng buộc:**
- ✅ Chỉ hiển thị shows có `showDateTime >= hiện tại`
- ✅ Không hiển thị show đã bị xóa
- ✅ Movie phải có ít nhất 1 show trong tương lai

---

### 3. 🎥 XEM CHI TIẾT PHIM & XEM TRAILER

**Nghiệp vụ:**
- Xem thông tin chi tiết phim, trailer, diễn viên
- Xem lịch chiếu theo ngày
- Không yêu cầu đăng nhập để xem, cần đăng nhập để đặt vé

**API:** `GET /api/show/:movieId`

**Luồng xử lý:**
```
1. Frontend gọi API với movieId từ URL params
2. Backend kiểm tra Movie có tồn tại trong DB không
3. Nếu KHÔNG → Fetch từ TMDB API:
   - GET /movie/{id} → Basic info
   - GET /movie/{id}/credits → Diễn viên
   - GET /movie/{id}/videos → Trailer key
   - Lưu vào MongoDB
4. Nếu CÓ → Lấy từ DB
5. Query tất cả Shows của movie có showDateTime >= NOW
6. Populate hall information
7. Group shows theo ngày
8. Return movie + dateTime object
```

**Ràng buộc:**
- ✅ Movie phải có trong TMDB
- ✅ Chỉ hiển thị shows trong tương lai
- ✅ Trailer key có thể null (một số phim không có trailer)
- ✅ Vote average phải từ 0-10
- ✅ Runtime phải > 0 phút

**Hiển thị Trailer:**
```javascript
// Frontend
if (movie.trailer_key) {
  // Embed YouTube: https://www.youtube.com/embed/{trailer_key}
  <TrailerModal trailerKey={movie.trailer_key} />
} else {
  toast.error("Trailer không khả dụng")
}
```

---

### 4. ❤️ THÊM/XÓA PHIM YÊU THÍCH

**Nghiệp vụ:**
- User có thể lưu phim yêu thích để xem sau
- Dữ liệu lưu trong MongoDB User collection

**APIs:**
- `POST /api/user/update-favorite` - Toggle favorite
- `GET /api/user/favorites` - Lấy danh sách favorites

**Luồng xử lý (update-favorite):**
```
1. Frontend gọi API với movieId
2. Backend verify JWT token → Lấy userId
3. Tìm User trong MongoDB
4. Nếu user chưa tồn tại:
   - Lấy thông tin từ Clerk API
   - Tạo User mới trong MongoDB
5. Kiểm tra movieId có trong favoriteMovies array không
6. Nếu CÓ → Remove (splice)
7. Nếu KHÔNG → Add (push)
8. Save user
9. Return success message
```

**Optimistic UI Update:**
```javascript
// Frontend
const handleFavorite = async () => {
  // 1. Update UI ngay lập tức (không đợi API)
  const isFavorited = favoriteMovies.find(m => m._id === id);
  if (isFavorited) {
    setFavoriteMovies(prev => prev.filter(m => m._id !== id));
  } else {
    setFavoriteMovies(prev => [...prev, movie]);
  }
  
  // 2. Gọi API ở background
  try {
    await axios.post('/api/user/update-favorite', {movieId: id});
    toast.success(isFavorited ? "Đã hủy yêu thích" : "Đã thêm yêu thích");
  } catch (error) {
    // Rollback UI nếu lỗi
    if (isFavorited) {
      setFavoriteMovies(prev => [...prev, movie]);
    } else {
      setFavoriteMovies(prev => prev.filter(m => m._id !== id));
    }
    toast.error("Có lỗi xảy ra");
  }
}
```

**Ràng buộc:**
- ✅ Phải đăng nhập mới được thêm favorite
- ✅ Mỗi movie chỉ có thể favorite 1 lần
- ✅ Không giới hạn số lượng phim yêu thích
- ✅ UI update ngay lập tức (Optimistic UI) để UX tốt hơn
- ✅ Tự động rollback nếu API lỗi

---

### 5. 🪑 CHỌN GHẾ VÀ ĐẶT VÉ

**Nghiệp vụ:**
- Chọn suất chiếu theo ngày, giờ, phòng
- Xem sơ đồ ghế real-time
- Chọn tối đa 5 ghế
- Thanh toán qua Stripe

**APIs:**
- `GET /api/booking/seats/:showId` - Lấy ghế đã đặt
- `POST /api/booking/create` - Tạo booking

#### 5.1. Xem sơ đồ ghế

**API:** `GET /api/booking/seats/:showId`

**Luồng xử lý:**
```
1. Frontend gọi API với showId
2. Backend query Show và populate hall
3. Lấy occupiedSeats object
4. Lấy seatLayout từ hall
5. Return data
```

**Response:**
```json
{
  "success": true,
  "occupiedSeats": {
    "A1": "user_abc",
    "A2": "user_abc",
    "B5": "user_xyz"
  },
  "hall": {
    "name": "Phòng 1 - Standard",
    "seatLayout": {
      "rows": ["A", "B", "C", ..., "J"],
      "seatsPerRow": 9,
      "coupleSeatsRows": ["H", "J"]
    },
    "type": "Standard",
    "priceMultiplier": 1
  },
  "show": {
    "showDateTime": "2025-12-31T12:55:00.000Z",
    "showPrice": 80000,
    "movie": {...}
  }
}
```

**Frontend render ghế:**
```javascript
// Tạo seat map
rows.map(row => {
  for (let i = 1; i <= seatsPerRow; i++) {
    const seatId = `${row}${i}`;
    const isOccupied = occupiedSeats[seatId] !== undefined;
    const isCoupleSeat = coupleSeatsRows.includes(row);
    
    return (
      <Seat
        id={seatId}
        isOccupied={isOccupied}
        isCouple={isCoupleSeat}
        onSelect={handleSelectSeat}
      />
    );
  }
})
```

#### 5.2. Tính toán giá vé

**Công thức:**
```javascript
// Base price
basePrice = show.showPrice * hall.priceMultiplier

// Cho mỗi ghế đã chọn
for (seat of selectedSeats) {
  let seatPrice = basePrice;
  
  // Phụ thu ghế đôi
  const row = seat[0]; // "A1" → "A"
  if (hall.seatLayout.coupleSeatsRows.includes(row)) {
    seatPrice += 10000; // +10k VND
  }
  
  // Phụ thu suất tối (sau 17:00)
  const hour = new Date(show.showDateTime).getHours();
  if (hour >= 17) {
    seatPrice += 10000; // +10k VND
  }
  
  totalAmount += seatPrice;
}
```

**Ví dụ tính giá:**
```
Show: Avatar - IMAX - 19:00 - Giá gốc 80.000₫
Chọn: 2 ghế đôi (H1, H2)

Tính toán:
- Base price (IMAX): 80.000 × 2 = 160.000₫
- Ghế H1:
  + Base: 160.000₫
  + Phụ thu ghế đôi: +10.000₫
  + Phụ thu suất tối: +10.000₫
  = 180.000₫
- Ghế H2: 180.000₫
TỔNG: 360.000₫
```

**Ràng buộc:**
- ✅ Tối đa 5 ghế/lần đặt
- ✅ Không được chọn ghế đã có người đặt
- ✅ Phải chọn ít nhất 1 ghế
- ✅ Tính giá real-time khi chọn/bỏ ghế

#### 5.3. Tạo booking và thanh toán

**API:** `POST /api/booking/create`

**Request Body:**
```json
{
  "showId": "show_id_here",
  "seats": ["A1", "A2"]
}
```

**Luồng xử lý chi tiết:**
```
1. Frontend gửi showId + seats array
2. Backend verify JWT → Lấy userId
3. Validate input:
   - Show tồn tại không?
   - Show chưa diễn ra chưa?
   - Seats có hợp lệ không?
   - Seats còn trống không?
4. Kiểm tra ghế trùng:
   FOR each seat IN seats:
     IF seat IN show.occupiedSeats:
       RETURN error "Ghế đã được đặt"
5. Tính tổng tiền (theo công thức trên)
6. Tạo Booking record:
   - user: userId
   - show: showId
   - bookedSeats: seats
   - amount: totalAmount
   - ispaid: false (chưa thanh toán)
   - paymentLink: "" (sẽ update sau)
7. Chiếm giữ ghế (Lock seats):
   FOR each seat IN seats:
     show.occupiedSeats[seat] = userId
   save(show)
8. Tạo Stripe Checkout Session:
   - line_items: [{
       price_data: {
         currency: 'vnd',
         product_data: {
           name: `Vé phim ${movie.title}`,
           description: `${seats.length} ghế: ${seats.join(', ')}`
         },
         unit_amount: totalAmount
       },
       quantity: 1
     }]
   - metadata: { bookingId }
   - success_url: /loading/my-bookings
   - cancel_url: /my-bookings
   - expires_at: now + 30 minutes
9. Update booking.paymentLink = session.url
10. Trigger Inngest event "app/checkpayment":
    - bookingId
    - Sau 10 phút sẽ check, nếu chưa thanh toán → Hủy booking
11. Return payment URL
12. Frontend redirect user đến Stripe Checkout
```

**Ràng buộc:**
- ✅ Show phải trong tương lai (showDateTime > NOW)
- ✅ Ghế phải thuộc hall của show
- ✅ Không được đặt ghế đã bị chiếm
- ✅ Booking chưa thanh toán sẽ tự động hủy sau 10 phút
- ✅ Stripe session hết hạn sau 30 phút
- ✅ Mỗi ghế chỉ có thể được đặt bởi 1 user tại 1 thời điểm

**Xử lý race condition (2 user cùng chọn 1 ghế):**
```javascript
// Backend sử dụng MongoDB transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Lock document
  const show = await Show.findById(showId).session(session);
  
  // 2. Kiểm tra ghế
  for (const seat of seats) {
    if (show.occupiedSeats[seat]) {
      throw new Error(`Ghế ${seat} đã được đặt`);
    }
  }
  
  // 3. Chiếm ghế
  for (const seat of seats) {
    show.occupiedSeats[seat] = userId;
  }
  await show.save({ session });
  
  // 4. Tạo booking
  await Booking.create([bookingData], { session });
  
  // 5. Commit transaction
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

### 6. 💳 THANH TOÁN VÀ XÁC NHẬN

**Nghiệp vụ:**
- User thanh toán qua Stripe Checkout
- Nhận email xác nhận có QR code
- Booking được cập nhật trạng thái

#### 6.1. Quy trình thanh toán

**Luồng:**
```
1. User điền thông tin thẻ trên Stripe Checkout
2. Stripe xử lý thanh toán
3. Stripe gửi webhook về backend: POST /api/stripe
4. Backend verify webhook signature
5. Nếu event = "checkout.session.completed":
   - Lấy bookingId từ metadata
   - Update booking:
     + ispaid = true
     + paymentLink = ""
   - Trigger Inngest event "app/show.booked"
6. Inngest function "send-booking-confirmation-email":
   - Đợi 5 giây (đảm bảo DB đã update)
   - Lấy booking info (populate user, show, movie)
   - Tạo QR code (data = booking details)
   - Gửi email qua Brevo API
7. User nhận email với QR code
8. Frontend redirect user về /my-bookings
```

#### 6.2. Stripe Webhook Handler

**API:** `POST /api/stripe`

**Code xử lý:**
```javascript
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify signature
    event = stripe.webhooks.constructEvent(
      req.body, // Raw body (Buffer)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Xử lý event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    // Update booking
    await Booking.findByIdAndUpdate(bookingId, {
      ispaid: true,
      paymentLink: ""
    });

    // Trigger email
    await inngest.send({
      name: 'app/show.booked',
      data: { bookingId }
    });
  }

  res.json({ received: true });
};
```

**Ràng buộc:**
- ✅ Phải verify webhook signature (bảo mật)
- ✅ Chỉ xử lý event "checkout.session.completed"
- ✅ Booking phải tồn tại
- ✅ Không được update booking đã thanh toán (idempotency)

#### 6.3. Gửi email xác nhận

**Inngest Function:** `send-booking-confirmation-email`

**Trigger:** Event `app/show.booked`

**Luồng:**
```
1. Nhận bookingId từ event
2. Đợi 5 giây (đảm bảo Stripe webhook đã update DB)
3. Query booking từ DB:
   - Populate user
   - Populate show → movie, hall
4. Tạo nội dung email:
   - Tên khách: user.name
   - Phim: movie.title
   - Ngày giờ: showDateTime (format VN)
   - Phòng: hall.name
   - Ghế: bookedSeats.join(", ")
   - Tổng tiền: amount (format VND)
   - Mã booking: bookingId
5. Tạo QR code:
   - Data: JSON.stringify({
       bookingId,
       userId: user._id,
       showId: show._id,
       seats: bookedSeats,
       movieTitle: movie.title
     })
   - Encode base64
6. Gửi email qua Brevo API:
   - Endpoint: POST https://api.brevo.com/v3/smtp/email
   - Headers: { 'api-key': BREVO_API_KEY }
   - Body: {
       sender: { email: SENDER_EMAIL, name: "QuickShow Cinema" },
       to: [{ email: user.email, name: user.name }],
       subject: "Xác nhận đặt vé thành công",
       htmlContent: emailTemplate,
       attachment: [qrCodeImage]
     }
7. Log kết quả
```

**Email Template:**
```html
<h2>Cảm ơn bạn đã đặt vé!</h2>
<p>Xin chào ${user.name},</p>
<p>Đặt vé của bạn đã được xác nhận.</p>

<h3>Thông tin vé:</h3>
<ul>
  <li>Phim: <strong>${movie.title}</strong></li>
  <li>Ngày giờ: <strong>${formatDate(showDateTime)}</strong></li>
  <li>Phòng: <strong>${hall.name}</strong></li>
  <li>Ghế: <strong>${seats}</strong></li>
  <li>Tổng tiền: <strong>${formatVND(amount)}</strong></li>
</ul>

<p>Vui lòng đến rạp trước giờ chiếu 15 phút và xuất trình QR code đính kèm.</p>

<img src="cid:qrcode" alt="QR Code" />

<p>Chúc bạn có trải nghiệm xem phim vui vẻ!</p>
```

**Ràng buộc:**
- ✅ Email phải được gửi trong vòng 1 phút sau thanh toán
- ✅ QR code phải chứa đủ thông tin để check-in
- ✅ Retry 3 lần nếu gửi email thất bại
- ✅ Log lỗi nếu không gửi được

---

### 7. 📋 XEM LỊCH SỬ ĐẶT VÉ

**Nghiệp vụ:**
- User xem tất cả bookings của mình
- Hiển thị cả đã thanh toán và chưa thanh toán
- Booking chưa thanh toán có link "Thanh toán ngay"

**API:** `GET /api/user/bookings`

**Luồng xử lý:**
```
1. Frontend gọi API (có JWT token)
2. Backend verify token → Lấy userId
3. Query bookings:
   - user = userId
   - Populate show → movie, hall
   - Sort by createdAt DESC (mới nhất trước)
4. Return bookings array
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "booking_id",
      "user": "user_id",
      "show": {
        "showDateTime": "2025-12-31T12:55:00.000Z",
        "showPrice": 80000,
        "hall": {
          "name": "Phòng 1 - Standard"
        },
        "movie": {
          "title": "Avatar: Fire and Ash",
          "poster_path": "/path.jpg"
        }
      },
      "bookedSeats": ["A1", "A2"],
      "amount": 160000,
      "ispaid": true,
      "paymentLink": "",
      "createdAt": "2025-12-25T10:00:00.000Z"
    }
  ]
}
```

**UI Display:**
```jsx
bookings.map(booking => (
  <div className="booking-card">
    <img src={booking.show.movie.poster_path} />
    <div>
      <h3>{booking.show.movie.title}</h3>
      <p>Ngày: {formatDate(booking.show.showDateTime)}</p>
      <p>Phòng: {booking.show.hall.name}</p>
      <p>Ghế: {booking.bookedSeats.join(", ")}</p>
      <p>Tổng: {formatVND(booking.amount)}</p>
      
      {booking.ispaid ? (
        <span className="badge-success">Đã thanh toán</span>
      ) : (
        <>
          <span className="badge-pending">Chưa thanh toán</span>
          <a href={booking.paymentLink}>Thanh toán ngay</a>
        </>
      )}
    </div>
  </div>
))
```

**Ràng buộc:**
- ✅ Phải đăng nhập mới xem được
- ✅ Chỉ xem được booking của chính mình
- ✅ Hiển thị cả booking đã hủy (nếu chưa xóa)
- ✅ Link thanh toán hết hạn sau 30 phút

---

## 👨‍💼 CHỨC NĂNG QUẢN TRỊ VIÊN - CHI TIẾT

### 1. 🔐 PHÂN QUYỀN ADMIN

**Nghiệp vụ:**
- Chỉ user có role "admin" mới truy cập được `/admin/*`
- Role lưu trong Clerk privateMetadata

**Middleware:** `protectAdmin`

**Code:**
```javascript
export const protectAdmin = async (req, res, next) => {
  try {
    const userId = req.auth().userId;
    const user = await clerkClient.users.getUser(userId);
    
    if (user.privateMetadata.role === 'admin') {
      next(); // Cho phép tiếp tục
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
};
```

**Set user thành admin:**
```javascript
// Cách 1: Qua Clerk Dashboard
// Users → Select user → Private metadata
{
  "role": "admin"
}

// Cách 2: Qua API (setup script)
await clerkClient.users.updateUserMetadata(userId, {
  privateMetadata: { role: 'admin' }
});
```

**Frontend protection:**
```javascript
// AppContext
const [isAdmin, setIsAdmin] = useState(false);

const fetchIsAdmin = async () => {
  const {data} = await axios.get('/api/admin/is-admin');
  setIsAdmin(data.isAdmin);
  
  if (!data.isAdmin && location.pathname.startsWith('/admin')) {
    navigate('/');
    toast.error('Bạn không có quyền truy cập');
  }
};
```

**Ràng buộc:**
- ✅ Mọi route `/api/admin/*` đều phải có middleware `protectAdmin`
- ✅ Frontend cũng phải check (tránh UI leak)
- ✅ Chỉ admin thực sự mới tạo được admin khác (security)

---

### 2. 📊 DASHBOARD TỔNG QUAN

**Nghiệp vụ:**
- Hiển thị thống kê tổng quan hệ thống
- Real-time data

**API:** `GET /api/admin/dashboard`

**Dữ liệu hiển thị:**
```javascript
{
  totalBookings: Number,      // Số booking đã thanh toán
  totalRevenue: Number,       // Tổng doanh thu (VND)
  activeShows: Array,         // Shows đang hoạt động
  totalUser: Number          // Tổng số user
}
```

**Luồng tính toán:**
```javascript
export const getDashboardData = async (req, res) => {
  // 1. Tính tổng booking đã thanh toán
  const bookings = await Booking.find({ ispaid: true });
  const totalBookings = bookings.length;
  
  // 2. Tính tổng doanh thu
  const totalRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);
  
  // 3. Lấy shows đang hoạt động
  const activeShows = await Show.find({
    showDateTime: { $gte: new Date() },
    hall: { $exists: true }
  }).populate('movie').populate('hall');
  
  // 4. Đếm tổng user
  const totalUser = await User.countDocuments();
  
  res.json({
    success: true,
    dashboardData: {
      totalBookings,
      totalRevenue,
      activeShows,
      totalUser
    }
  });
};
```

**UI Display:**
```jsx
<div className="stats-grid">
  {/* Card 1: Doanh thu */}
  <div className="stat-card">
    <h3>Tổng doanh thu</h3>
    <p className="big-number">{formatVND(totalRevenue)}</p>
    <span>+12% so với tháng trước</span>
  </div>
  
  {/* Card 2: Booking */}
  <div className="stat-card">
    <h3>Tổng đặt chỗ</h3>
    <p className="big-number">{totalBookings}</p>
  </div>
  
  {/* Card 3: Shows */}
  <div className="stat-card">
    <h3>Suất chiếu hoạt động</h3>
    <p className="big-number">{activeShows.length}</p>
  </div>
  
  {/* Card 4: Users */}
  <div className="stat-card">
    <h3>Tổng người dùng</h3>
    <p className="big-number">{totalUser}</p>
  </div>
</div>

{/* Bảng shows */}
<table>
  <thead>
    <tr>
      <th>Phim</th>
      <th>Phòng</th>
      <th>Thời gian</th>
      <th>Ghế đã đặt</th>
    </tr>
  </thead>
  <tbody>
    {activeShows.map(show => (
      <tr key={show._id}>
        <td>{show.movie.title}</td>
        <td>{show.hall.name}</td>
        <td>{formatDateTime(show.showDateTime)}</td>
        <td>{Object.keys(show.occupiedSeats).length} / {show.hall.totalSeats}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**Ràng buộc:**
- ✅ Chỉ tính booking đã thanh toán vào doanh thu
- ✅ Chỉ hiển thị shows trong tương lai
- ✅ Shows phải có hall (loại legacy data)
- ✅ Làm mới data khi vào lại trang

---

### 3. ➕ THÊM SUẤT CHIẾU

**Nghiệp vụ:**
- Admin chọn phim từ TMDB
- Tạo nhiều suất chiếu cùng lúc
- Hệ thống tự động phát hiện xung đột lịch chiếu

**APIs:**
- `GET /api/show/now-playing` - Lấy danh sách phim đang chiếu từ TMDB
- `POST /api/show/add` - Tạo suất chiếu mới

#### 3.1. Lấy danh sách phim từ TMDB

**API:** `GET /api/show/now-playing?page=1`

**Luồng:**
```
1. Frontend gọi API
2. Backend gọi TMDB:
   - GET https://api.themoviedb.org/3/movie/now_playing
   - Params: { language: 'vi-VN', page }
3. TMDB trả về:
   - results: Array movies
   - total_pages: Number
4. Backend forward về frontend
```

**Response:**
```json
{
  "success": true,
  "page": 1,
  "total_pages": 50,
  "results": [
    {
      "id": 83533,
      "title": "Avatar: Fire and Ash",
      "poster_path": "/8O8cZbdUg2gC6AW6R9zNjCdFNcK.jpg",
      "vote_average": 7.4,
      "release_date": "2025-12-17"
    }
  ]
}
```

#### 3.2. Thêm suất chiếu

**API:** `POST /api/show/add`

**Request Body:**
```json
{
  "movie": "83533",
  "hallId": "hall_objectid_here",
  "showTimes": [
    "2025-12-25T11:00:00.000Z",
    "2025-12-25T14:00:00.000Z",
    "2025-12-26T10:00:00.000Z"
  ],
  "showPrice": 80000
}
```

**Luồng xử lý chi tiết:**
```
1. Validate input:
   - movie phải là số (TMDB ID)
   - hallId phải tồn tại trong CinemaHalls
   - showTimes phải là array không rỗng
   - Mỗi showTime phải >= NOW
   - showPrice > 0

2. Kiểm tra Movie có trong DB chưa:
   IF NOT EXIST:
     a. Fetch từ TMDB:
        - GET /movie/{id}?language=vi-VN
        - GET /movie/{id}/credits?language=vi-VN
        - GET /movie/{id}/videos
     b. Transform data:
        - Lấy genres, overview, poster, backdrop
        - Lấy top 20 cast
        - Tìm trailer YouTube (type='Trailer', site='YouTube')
     c. Save Movie vào DB

3. Lấy Hall từ DB:
   - Populate seatLayout, priceMultiplier

4. Tính endDateTime cho mỗi showTime:
   endDateTime = showDateTime + runtime + BUFFER_TIME + CLEANING_TIME
   // BUFFER_TIME = 10 phút
   // CLEANING_TIME = 20 phút
   
   Example:
   - Runtime: 188 phút (Avatar)
   - showDateTime: 2025-12-25 18:00
   - endDateTime: 2025-12-25 21:18 (18:00 + 188 + 30)

5. Kiểm tra conflict cho MỖI showTime:
   conflictingShows = await Show.find({
     hall: hallId,
     $or: [
       // Case 1: Show mới bắt đầu trong show cũ
       {
         showDateTime: { $lte: newShowDateTime },
         endDateTime: { $gt: newShowDateTime }
       },
       // Case 2: Show mới kết thúc trong show cũ
       {
         showDateTime: { $lt: newEndDateTime },
         endDateTime: { $gte: newEndDateTime }
       },
       // Case 3: Show mới bọc show cũ
       {
         showDateTime: { $gte: newShowDateTime },
         endDateTime: { $lte: newEndDateTime }
       }
     ]
   });
   
   IF conflictingShows.length > 0:
     RETURN error: "Trùng lịch với suất chiếu khác"

6. Tạo Shows:
   FOR each showTime IN showTimes:
     await Show.create({
       movie: movieId,
       hall: hallId,
       showDateTime: showTime,
       endDateTime: calculateEndTime(showTime, runtime),
       showPrice,
       occupiedSeats: {}
     });

7. Trigger Inngest event "app/show.added":
   - Để gửi email thông báo phim mới cho users

8. Return success
```

**Conflict Detection - Ví dụ:**
```
Phòng 1 đã có:
- Show A: 10:00 - 12:30 (Avatar, 150 phút)
- Show B: 15:00 - 17:30 (Spider-Man, 150 phút)

Thêm Show C mới:
✅ OK: 13:00 - 15:30 (không trùng)
❌ CONFLICT: 11:00 - 13:30 (trùng với Show A)
❌ CONFLICT: 16:00 - 18:30 (trùng với Show B)
❌ CONFLICT: 09:00 - 18:00 (bọc cả Show A và B)
```

**Ràng buộc:**
- ✅ Phim phải có trong TMDB
- ✅ Phòng chiếu phải tồn tại
- ✅ Không được tạo show trong quá khứ
- ✅ Không được trùng lịch với show khác trong cùng phòng
- ✅ Buffer time tối thiểu 30 phút (10 + 20)
- ✅ ShowPrice phải > 0
- ✅ Nếu 1 showTime bị conflict → Rollback toàn bộ (transaction)

**Xử lý lỗi:**
- Movie không tồn tại trong TMDB → Toast error
- Hall không tồn tại → Toast error
- Conflict detected → Hiển thị chi tiết show bị trùng
- Network error → Toast error + retry

---

### 4. 📋 DANH SÁCH SUẤT CHIẾU

**Nghiệp vụ:**
- Xem tất cả suất chiếu sắp tới
- Sắp xếp theo thời gian
- Xem số ghế đã đặt và doanh thu dự kiến

**API:** `GET /api/admin/all-shows`

**Luồng:**
```
1. Query shows:
   - showDateTime >= NOW
   - hall exists (loại legacy data)
   - Populate movie
   - Populate hall
   - Sort by showDateTime ASC
2. Return shows array
```

**Response:**
```json
{
  "success": true,
  "shows": [
    {
      "_id": "show_id",
      "movie": {
        "title": "Avatar: Fire and Ash",
        "poster_path": "/path.jpg"
      },
      "hall": {
        "name": "Phòng 4 - IMAX",
        "totalSeats": 100
      },
      "showDateTime": "2025-12-31T12:55:00.000Z",
      "showPrice": 80000,
      "occupiedSeats": {
        "A1": "user1",
        "A2": "user1"
      }
    }
  ]
}
```

**UI Display:**
```jsx
<table>
  <thead>
    <tr>
      <th>Phim</th>
      <th>Phòng</th>
      <th>Thời gian chiếu</th>
      <th>Ghế đã đặt</th>
      <th>Doanh thu dự kiến</th>
    </tr>
  </thead>
  <tbody>
    {shows.map(show => {
      const bookedSeatsCount = Object.keys(show.occupiedSeats).length;
      const estimatedRevenue = bookedSeatsCount * show.showPrice;
      
      return (
        <tr key={show._id}>
          <td>
            <img src={show.movie.poster_path} />
            {show.movie.title}
          </td>
          <td>{show.hall.name}</td>
          <td>{formatDateTime(show.showDateTime)}</td>
          <td>
            {bookedSeatsCount} / {show.hall.totalSeats}
            <progress value={bookedSeatsCount} max={show.hall.totalSeats} />
          </td>
          <td>{formatVND(estimatedRevenue)}</td>
        </tr>
      );
    })}
  </tbody>
</table>
```

**Ràng buộc:**
- ✅ Chỉ hiển thị shows trong tương lai
- ✅ Shows phải có hall (loại bỏ data cũ không hợp lệ)
- ✅ Sắp xếp theo thời gian tăng dần
- ✅ Doanh thu chỉ là dự kiến (chưa chắc đã thanh toán)

---

### 5. 📝 DANH SÁCH ĐẶT CHỖ

**Nghiệp vụ:**
- Xem tất cả bookings (admin có quyền xem tất cả)
- Filter theo: trạng thái, ngày đặt, phim, phòng chiếu
- Tìm kiếm theo tên khách hàng
- Hiển thị thống kê doanh thu

**API:** `GET /api/admin/all-bookings`

**Luồng:**
```
1. Query bookings:
   - Tất cả bookings (không filter user)
   - Populate user
   - Populate show → movie, hall
   - Sort by createdAt DESC
2. Return bookings array
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "booking_id",
      "user": {
        "_id": "user_id",
        "name": "Nguyễn Văn A",
        "email": "nguyenvana@example.com"
      },
      "show": {
        "showDateTime": "2025-12-31T12:55:00.000Z",
        "hall": {
          "name": "Phòng 1 - Standard"
        },
        "movie": {
          "title": "Avatar: Fire and Ash"
        }
      },
      "bookedSeats": ["A1", "A2"],
      "amount": 160000,
      "ispaid": true,
      "createdAt": "2025-12-25T10:00:00.000Z"
    }
  ]
}
```

**Frontend Filters (Client-side):**
```javascript
// 1. Filter theo trạng thái thanh toán
const [paymentFilter, setPaymentFilter] = useState('all');
// 'all' | 'paid' | 'unpaid'

// 2. Filter theo thời gian đặt vé
const [dateRangeFilter, setDateRangeFilter] = useState('all');
// 'all' | 'today' | '7days' | '30days'

// 3. Filter theo phim
const [movieFilter, setMovieFilter] = useState('all');
// 'all' | movieId

// 4. Filter theo phòng chiếu
const [hallFilter, setHallFilter] = useState('all');
// 'all' | hallId

// 5. Tìm kiếm theo tên khách hàng
const [searchQuery, setSearchQuery] = useState('');

// Apply filters
const filteredBookings = useMemo(() => {
  return bookings.filter(booking => {
    // Payment filter
    if (paymentFilter === 'paid' && !booking.ispaid) return false;
    if (paymentFilter === 'unpaid' && booking.ispaid) return false;
    
    // Date range filter
    if (dateRangeFilter !== 'all') {
      const bookingDate = new Date(booking.createdAt);
      const now = new Date();
      
      if (dateRangeFilter === 'today') {
        const today = new Date(now.setHours(0, 0, 0, 0));
        if (bookingDate < today) return false;
      } else if (dateRangeFilter === '7days') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        if (bookingDate < sevenDaysAgo) return false;
      } else if (dateRangeFilter === '30days') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        if (bookingDate < thirtyDaysAgo) return false;
      }
    }
    
    // Movie filter
    if (movieFilter !== 'all') {
      if (booking.show?.movie?._id !== movieFilter) return false;
    }
    
    // Hall filter
    if (hallFilter !== 'all') {
      if (booking.show?.hall?._id !== hallFilter) return false;
    }
    
    // Search query (customer name)
    if (searchQuery) {
      const userName = booking.user?.name || '';
      if (!userName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
}, [bookings, paymentFilter, dateRangeFilter, movieFilter, hallFilter, searchQuery]);
```

**UI Components:**
```jsx
{/* Search Box */}
<input
  type="text"
  placeholder="Tìm kiếm theo tên khách hàng..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

{/* Filters Row */}
<div className="filters">
  {/* Trạng thái */}
  <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
    <option value="all">Tất cả</option>
    <option value="paid">Đã thanh toán</option>
    <option value="unpaid">Chưa thanh toán</option>
  </select>
  
  {/* Thời gian */}
  <select value={dateRangeFilter} onChange={(e) => setDateRangeFilter(e.target.value)}>
    <option value="all">Tất cả</option>
    <option value="today">Hôm nay</option>
    <option value="7days">7 ngày qua</option>
    <option value="30days">30 ngày qua</option>
  </select>
  
  {/* Phim */}
  <select value={movieFilter} onChange={(e) => setMovieFilter(e.target.value)}>
    <option value="all">Tất cả phim</option>
    {uniqueMovies.map(movie => (
      <option value={movie._id}>{movie.title}</option>
    ))}
  </select>
  
  {/* Phòng chiếu */}
  <select value={hallFilter} onChange={(e) => setHallFilter(e.target.value)}>
    <option value="all">Tất cả phòng</option>
    {uniqueHalls.map(hall => (
      <option value={hall._id}>{hall.name}</option>
    ))}
  </select>
  
  {/* Results count */}
  <span>Hiển thị: {filteredBookings.length} / {bookings.length}</span>
</div>

{/* Table */}
<table>
  <thead>
    <tr>
      <th>Tên khách hàng</th>
      <th>Tên phim</th>
      <th>Phòng chiếu</th>
      <th>Thời gian phim</th>
      <th>Chỗ ngồi</th>
      <th>Số lượng</th>
      <th>Tổng tiền</th>
      <th>Trạng thái</th>
    </tr>
  </thead>
  <tbody>
    {filteredBookings.map(booking => (
      <tr key={booking._id}>
        <td>{booking.user?.name || 'N/A'}</td>
        <td>{booking.show?.movie?.title || 'N/A'}</td>
        <td>
          <span className="badge">{booking.show?.hall?.name || 'N/A'}</span>
        </td>
        <td>{formatDateTime(booking.show?.showDateTime)}</td>
        <td>{booking.bookedSeats?.join(", ") || 'N/A'}</td>
        <td>{booking.bookedSeats?.length || 0} vé</td>
        <td>{formatVND(booking.amount)}</td>
        <td>
          {booking.ispaid ? (
            <span className="badge-success">Đã thanh toán</span>
          ) : (
            <span className="badge-pending">Chưa thanh toán</span>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Ràng buộc:**
- ✅ Admin xem được tất cả bookings của tất cả users
- ✅ Filter hoạt động kết hợp (AND logic)
- ✅ Search không phân biệt hoa thường
- ✅ Hiển thị N/A nếu data null (show/movie bị xóa)
- ✅ Sort mới nhất trước

---

### 6. 👥 DANH SÁCH NGƯỜI DÙNG

**Nghiệp vụ:**
- Xem tất cả users trong hệ thống
- Xem thống kê: tổng users, users mới
- Tìm kiếm theo tên/email

**API:** `GET /api/admin/all-users`

**Luồng:**
```
1. Query users:
   - Tất cả users
   - Populate favoriteMovies
   - Sort by createdAt DESC
2. Return users array
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_2abc123xyz",
      "name": "Nguyễn Văn A",
      "email": "nguyenvana@example.com",
      "image": "https://img.clerk.com/...",
      "favoriteMovies": ["83533", "12345"],
      "createdAt": "2025-12-20T10:00:00.000Z"
    }
  ]
}
```

**UI Display:**
```jsx
{/* Stats */}
<div className="stats">
  <div className="stat-card">
    <h3>Tổng người dùng</h3>
    <p>{users.length}</p>
  </div>
  <div className="stat-card">
    <h3>Người dùng mới (30 ngày)</h3>
    <p>{users.filter(u => isWithin30Days(u.createdAt)).length}</p>
  </div>
  <div className="stat-card">
    <h3>Có phim yêu thích</h3>
    <p>{users.filter(u => u.favoriteMovies.length > 0).length}</p>
  </div>
</div>

{/* Search */}
<input
  type="text"
  placeholder="Tìm kiếm theo tên hoặc email..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

{/* Table */}
<table>
  <thead>
    <tr>
      <th>Tên người dùng</th>
      <th>Email</th>
      <th>Ngày tham gia</th>
      <th>Phim yêu thích</th>
    </tr>
  </thead>
  <tbody>
    {filteredUsers.map(user => (
      <tr key={user._id}>
        <td>
          <div className="avatar">{user.name[0]}</div>
          {user.name}
        </td>
        <td>{user.email}</td>
        <td>{formatDate(user.createdAt)}</td>
        <td>
          <span className="badge">{user.favoriteMovies.length} phim</span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Ràng buộc:**
- ✅ Admin xem được tất cả users
- ✅ Không hiển thị password (Clerk quản lý)
- ✅ Avatar fallback = chữ cái đầu tên
- ✅ Search theo cả name và email

---

## 🔄 BACKGROUND JOBS (INNGEST)

### 1. 🔁 ĐỒNG BỘ USER TỪ CLERK

**Functions:**
- `sync-user-from-clerk` - Tạo user mới
- `update-user-from-clerk` - Update user
- `delete-user-with-clerk` - Xóa user

**Trigger:** Clerk webhooks

#### 1.1. Tạo user mới

**Event:** `clerk/user.created`

**Luồng:**
```
1. Clerk user được tạo (đăng ký)
2. Clerk gửi webhook về Inngest
3. Inngest trigger function "sync-user-from-clerk"
4. Function extract data từ event:
   - userId = event.data.id
   - name = firstName + " " + lastName
   - email = emailAddresses[0].emailAddress
   - image = imageUrl
5. Create User trong MongoDB:
   await User.create({
     _id: userId,
     name, email, image,
     favoriteMovies: []
   })
6. Log success
```

**Ràng buộc:**
- ✅ Email phải unique (MongoDB index)
- ✅ Nếu user đã tồn tại → Skip (idempotency)
- ✅ Retry 3 lần nếu DB connection failed

#### 1.2. Update user

**Event:** `clerk/user.updated`

**Luồng:**
```
1. Clerk user được update (đổi tên, avatar)
2. Clerk gửi webhook
3. Inngest trigger "update-user-from-clerk"
4. Update User trong MongoDB:
   await User.findByIdAndUpdate(userId, {
     name, email, image
   })
5. Log success
```

#### 1.3. Xóa user

**Event:** `clerk/user.deleted`

**Luồng:**
```
1. Clerk user bị xóa (admin xóa hoặc user tự xóa account)
2. Clerk gửi webhook
3. Inngest trigger "delete-user-with-clerk"
4. Xóa User khỏi MongoDB:
   await User.findByIdAndDelete(userId)
5. ⚠️ Không xóa bookings (giữ lại lịch sử)
6. Log success
```

**Ràng buộc:**
- ✅ Không xóa bookings (GDPR compliance - giữ lịch sử giao dịch)
- ✅ Có thể anonymize thay vì xóa (tùy yêu cầu)

---

### 2. ⏰ TỰ ĐỘNG HỦY BOOKING CHƯA THANH TOÁN

**Function:** `release-seats-delete-booking`

**Trigger:** Event `app/checkpayment` (từ createBooking)

**Nghiệp vụ:**
- Khi user tạo booking nhưng không thanh toán trong 10 phút
- Tự động giải phóng ghế và xóa booking

**Luồng chi tiết:**
```
1. User tạo booking (ispaid=false)
2. Backend trigger Inngest event:
   await inngest.send({
     name: 'app/checkpayment',
     data: { bookingId }
   })
3. Inngest function "release-seats-delete-booking" được trigger
4. Function đợi 10 phút:
   await step.sleep('wait-10-minutes', '10m')
5. Sau 10 phút, kiểm tra booking:
   const booking = await Booking.findById(bookingId)
     .populate({
       path: 'show',
       select: 'occupiedSeats'
     });
   
   IF booking === null:
     // Booking đã bị xóa (có thể user đã thanh toán rồi cancel)
     RETURN
   
   IF booking.ispaid === true:
     // User đã thanh toán trong 10 phút
     console.log('Booking paid, keep it')
     RETURN
   
   IF booking.ispaid === false:
     // User chưa thanh toán sau 10 phút
     
     // 1. Giải phóng ghế
     FOR each seat IN booking.bookedSeats:
       DELETE show.occupiedSeats[seat]
     await show.save()
     
     // 2. Xóa booking
     await Booking.findByIdAndDelete(bookingId)
     
     console.log('Booking deleted and seats released')
     RETURN
```

**Ràng buộc:**
- ✅ Chỉ xóa booking chưa thanh toán
- ✅ Đợi đúng 10 phút (không sớm hơn, không muộn hơn)
- ✅ Giải phóng tất cả ghế đã chiếm
- ✅ Idempotent (nếu booking đã bị xóa thì skip)
- ✅ Không ảnh hưởng đến booking đã thanh toán

**Edge cases:**
- User thanh toán đúng phút thứ 10 → Race condition
  - Giải pháp: Check `ispaid` trước khi xóa
- Show bị xóa trong lúc đợi 10 phút
  - Giải pháp: Check show existence
- Inngest down → Booking không bị xóa
  - Giải pháp: Có thể thêm cron job backup (chạy mỗi giờ check toàn bộ)

---

### 3. 📧 GỬI EMAIL XÁC NHẬN ĐẶT VÉ

**Function:** `send-booking-confirmation-email`

**Trigger:** Event `app/show.booked` (từ Stripe webhook)

**Nghiệp vụ:**
- Sau khi user thanh toán thành công
- Gửi email xác nhận có QR code

**Luồng chi tiết:**
```
1. Stripe webhook xác nhận thanh toán
2. Backend update booking.ispaid = true
3. Backend trigger Inngest event:
   await inngest.send({
     name: 'app/show.booked',
     data: { bookingId }
   })
4. Inngest function triggered
5. Đợi 5 giây (đảm bảo DB đã commit):
   await step.sleep('wait-for-db', '5s')
6. Lấy booking details:
   const booking = await Booking.findById(bookingId)
     .populate('user')
     .populate({
       path: 'show',
       populate: [
         { path: 'movie' },
         { path: 'hall' }
       ]
     });
   
   IF booking === null:
     throw new Error('Booking not found')
7. Tạo QR code:
   const qrData = JSON.stringify({
     bookingId: booking._id,
     userId: booking.user._id,
     showId: booking.show._id,
     movieTitle: booking.show.movie.title,
     seats: booking.bookedSeats,
     showDateTime: booking.show.showDateTime,
     hall: booking.show.hall.name
   });
   
   const qrCode = await QRCode.toDataURL(qrData, {
     width: 300,
     margin: 2
   });
   
   // Convert base64 to Buffer
   const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
8. Tạo email content:
   const emailHTML = `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <h2 style="color: #1a1a1a;">Cảm ơn bạn đã đặt vé!</h2>
       <p>Xin chào <strong>${booking.user.name}</strong>,</p>
       <p>Đặt vé của bạn đã được xác nhận thành công.</p>
       
       <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
         <h3 style="margin-top: 0;">Thông tin vé</h3>
         <table style="width: 100%;">
           <tr>
             <td><strong>Phim:</strong></td>
             <td>${booking.show.movie.title}</td>
           </tr>
           <tr>
             <td><strong>Ngày giờ:</strong></td>
             <td>${formatDateTime(booking.show.showDateTime)}</td>
           </tr>
           <tr>
             <td><strong>Phòng:</strong></td>
             <td>${booking.show.hall.name}</td>
           </tr>
           <tr>
             <td><strong>Ghế:</strong></td>
             <td>${booking.bookedSeats.join(", ")}</td>
           </tr>
           <tr>
             <td><strong>Tổng tiền:</strong></td>
             <td style="color: #e50914; font-size: 18px;">${formatVND(booking.amount)}</td>
           </tr>
           <tr>
             <td><strong>Mã booking:</strong></td>
             <td><code>${booking._id}</code></td>
           </tr>
         </table>
       </div>
       
       <div style="text-align: center; margin: 30px 0;">
         <p><strong>QR Code check-in:</strong></p>
         <img src="cid:qrcode" alt="QR Code" style="max-width: 300px;" />
         <p style="font-size: 12px; color: #666;">
           Vui lòng xuất trình QR code này khi đến rạp
         </p>
       </div>
       
       <p style="color: #666; font-size: 14px;">
         ⏰ Vui lòng đến rạp trước giờ chiếu 15 phút<br/>
         📧 Nếu có thắc mắc, vui lòng liên hệ: support@quickshow.com
       </p>
       
       <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
       <p style="text-align: center; color: #999; font-size: 12px;">
         © 2025 QuickShow Cinema. All rights reserved.
       </p>
     </div>
   `;
9. Gửi email qua Brevo:
   const response = await axios.post(
     'https://api.brevo.com/v3/smtp/email',
     {
       sender: {
         email: process.env.SENDER_EMAIL,
         name: 'QuickShow Cinema'
       },
       to: [{
         email: booking.user.email,
         name: booking.user.name
       }],
       subject: `🎬 Xác nhận đặt vé: ${booking.show.movie.title}`,
       htmlContent: emailHTML,
       attachment: [{
         name: 'qrcode.png',
         content: qrBuffer.toString('base64')
       }]
     },
     {
       headers: {
         'api-key': process.env.BREVO_API_KEY,
         'Content-Type': 'application/json'
       }
     }
   );
   
   IF response.status !== 201:
     throw new Error('Failed to send email')
10. Log success:
    console.log(`Email sent to ${booking.user.email}`)
```

**Ràng buộc:**
- ✅ Chỉ gửi cho booking đã thanh toán
- ✅ QR code phải chứa đủ thông tin
- ✅ Email phải có logo, format đẹp
- ✅ Retry 3 lần nếu gửi email failed
- ✅ Timeout 30 giây (nếu Brevo API chậm)

**Xử lý lỗi:**
- Booking not found → Skip (log warning)
- Brevo API failed → Retry 3 lần với exponential backoff
- QR code generation failed → Send email without QR (downgrade)

---

### 4. 🔔 GỬI THÔNG BÁO PHIM MỚI

**Function:** `send-new-show-notifications`

**Trigger:** Event `app/show.added` (từ addShow API)

**Nghiệp vụ:**
- Khi admin thêm show mới
- Gửi email thông báo cho tất cả users

**Luồng:**
```
1. Admin tạo show mới
2. Backend trigger event:
   await inngest.send({
     name: 'app/show.added',
     data: {
       movieId,
       showTimes: [...]
     }
   })
3. Inngest function triggered
4. Lấy thông tin phim:
   const movie = await Movie.findById(movieId)
5. Lấy tất cả users:
   const users = await User.find({})
6. Tạo email content:
   const emailHTML = `
     <h2>🎬 Phim mới đã ra mắt!</h2>
     <img src="${movie.poster_path}" style="max-width: 300px;" />
     <h3>${movie.title}</h3>
     <p>${movie.overview}</p>
     <p><strong>Thể loại:</strong> ${movie.genres.map(g => g.name).join(", ")}</p>
     <p><strong>Thời lượng:</strong> ${movie.runtime} phút</p>
     <a href="${FRONTEND_URL}/movies/${movie._id}" 
        style="display: inline-block; padding: 12px 24px; background: #e50914; color: white; text-decoration: none; border-radius: 4px;">
       Đặt vé ngay
     </a>
   `
7. Gửi email cho từng user (batch 50 users/lần):
   const batchSize = 50;
   for (let i = 0; i < users.length; i += batchSize) {
     const batch = users.slice(i, i + batchSize);
     
     await step.run(`send-batch-${i}`, async () => {
       const promises = batch.map(user =>
         sendEmail({
           to: user.email,
           subject: `🎬 Phim mới: ${movie.title}`,
           html: emailHTML
         })
       );
       await Promise.all(promises);
     });
   }
8. Log success
```

**Ràng buộc:**
- ✅ Không spam user (có thể thêm unsubscribe option)
- ✅ Gửi batch để tránh quá tải Brevo API
- ✅ Chỉ gửi cho users đã opt-in (có thể thêm field `emailNotifications: boolean`)
- ✅ Rate limit: Tối đa 50 emails/giây

**Cải tiến có thể làm:**
- Personalization: "Chào ${user.name}"
- Segmentation: Chỉ gửi cho users thích thể loại tương tự
- Tracking: Embed tracking pixel để biết user có mở email không
- Unsubscribe link

---

## 🔒 BẢO MẬT & XỬ LÝ LỖI

### 1. Authentication & Authorization

**JWT Token:**
```javascript
// Frontend
const token = await getToken(); // From Clerk
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Backend
const { userId } = req.auth(); // Clerk Express middleware
```

**Ràng buộc:**
- ✅ Token hết hạn sau 1 giờ (Clerk config)
- ✅ Refresh token tự động (Clerk SDK)
- ✅ Logout → Invalidate token trên Clerk

**Admin Authorization:**
```javascript
// Middleware
export const protectAdmin = async (req, res, next) => {
  const userId = req.auth().userId;
  const user = await clerkClient.users.getUser(userId);
  
  if (user.privateMetadata.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin only'
    });
  }
  
  next();
};

// Routes
router.get('/admin/dashboard', protectAdmin, getDashboard);
```

---

### 2. Input Validation

**Backend Validation:**
```javascript
// Example: createBooking
export const createBooking = async (req, res) => {
  const { showId, seats } = req.body;
  
  // Validate required fields
  if (!showId || !seats) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Validate seats is array
  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Seats must be a non-empty array'
    });
  }
  
  // Validate max 5 seats
  if (seats.length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 5 seats per booking'
    });
  }
  
  // Validate seat format (e.g., "A1", "B5")
  const seatRegex = /^[A-J]\d{1,2}$/;
  for (const seat of seats) {
    if (!seatRegex.test(seat)) {
      return res.status(400).json({
        success: false,
        message: `Invalid seat format: ${seat}`
      });
    }
  }
  
  // Continue...
};
```

**Frontend Validation:**
```javascript
// Example: SeatLayout
const handleBookNow = async () => {
  // Validate selected seats
  if (selectedSeats.length === 0) {
    toast.error('Vui lòng chọn ít nhất 1 ghế');
    return;
  }
  
  if (selectedSeats.length > 5) {
    toast.error('Tối đa 5 ghế mỗi lần đặt');
    return;
  }
  
  // Validate user logged in
  if (!user) {
    toast.error('Vui lòng đăng nhập để đặt vé');
    navigate('/sign-in');
    return;
  }
  
  // Continue...
};
```

---

### 3. Error Handling

**API Error Response Format:**
```javascript
// Success
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "message": "Error description",
  "error": "SEAT_OCCUPIED" // Error code (optional)
}
```

**Frontend Error Handling:**
```javascript
try {
  const {data} = await axios.post('/api/booking/create', payload);
  
  if (data.success) {
    toast.success('Đặt vé thành công!');
    window.location.href = data.paymentUrl;
  } else {
    toast.error(data.message);
  }
} catch (error) {
  if (error.response) {
    // API returned error
    toast.error(error.response.data.message || 'Có lỗi xảy ra');
  } else if (error.request) {
    // Network error
    toast.error('Không thể kết nối đến server');
  } else {
    // Other errors
    toast.error('Có lỗi xảy ra, vui lòng thử lại');
  }
  console.error(error);
}
```

**Common Error Codes:**
```javascript
const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'Vui lòng đăng nhập',
  FORBIDDEN: 'Bạn không có quyền truy cập',
  
  // Booking
  SEAT_OCCUPIED: 'Ghế đã được đặt',
  SHOW_EXPIRED: 'Suất chiếu đã qua',
  MAX_SEATS_EXCEEDED: 'Tối đa 5 ghế/lần',
  
  // Payment
  PAYMENT_FAILED: 'Thanh toán thất bại',
  PAYMENT_TIMEOUT: 'Hết thời gian thanh toán',
  
  // Show
  CONFLICT_SCHEDULE: 'Trùng lịch với suất chiếu khác',
  INVALID_SHOW_TIME: 'Thời gian chiếu không hợp lệ',
  
  // General
  NOT_FOUND: 'Không tìm thấy',
  SERVER_ERROR: 'Lỗi server, vui lòng thử lại'
};
```

---

### 4. Rate Limiting

**Backend (Express Rate Limit):**
```javascript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

app.use('/api/', apiLimiter);

// Strict rate limit for booking
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 bookings per minute
  skipSuccessfulRequests: false
});

app.use('/api/booking/create', bookingLimiter);
```

---

### 5. Security Headers

**Helmet.js:**
```javascript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "https://js.stripe.com"],
    imgSrc: ["'self'", "https://image.tmdb.org", "data:"],
    connectSrc: ["'self'", "https://api.stripe.com"]
  }
}));
```

---

### 6. CORS Configuration

```javascript
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 📊 TỔNG KẾT RÀNG BUỘC NGHIỆP VỤ

### Ràng buộc về User
1. ✅ Email phải unique
2. ✅ User phải đăng nhập để đặt vé
3. ✅ User chỉ xem được booking của mình
4. ✅ User có thể yêu thích không giới hạn số phim

### Ràng buộc về Show
1. ✅ Show phải có movie và hall
2. ✅ showDateTime phải >= hiện tại (không tạo show trong quá khứ)
3. ✅ endDateTime = showDateTime + runtime + 30 phút
4. ✅ Không được trùng lịch với show khác trong cùng phòng
5. ✅ showPrice > 0

### Ràng buộc về Booking
1. ✅ Tối đa 5 ghế/lần đặt
2. ✅ Không được đặt ghế đã bị chiếm
3. ✅ Booking chưa thanh toán tự động hủy sau 10 phút
4. ✅ Ghế được lock ngay khi tạo booking
5. ✅ Mỗi ghế chỉ có thể được đặt bởi 1 user

### Ràng buộc về Payment
1. ✅ Stripe session hết hạn sau 30 phút
2. ✅ Webhook phải verify signature
3. ✅ Chỉ update booking khi payment thành công
4. ✅ Gửi email sau khi thanh toán thành công

### Ràng buộc về Admin
1. ✅ Chỉ admin mới truy cập được route admin
2. ✅ Admin xem được tất cả bookings
3. ✅ Admin không được tạo show trùng lịch
4. ✅ Admin xem được thống kê real-time

---

## 🎯 KẾT LUẬN

Đây là tài liệu chi tiết về nghiệp vụ hệ thống đặt vé xem phim. Hệ thống bao gồm:

**Chức năng chính:**
- ✅ 7 chức năng người dùng
- ✅ 6 chức năng admin
- ✅ 4 background jobs (Inngest)
- ✅ Integration với 5 dịch vụ bên ngoài

**Công nghệ:**
- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + MongoDB
- Auth: Clerk
- Payment: Stripe
- Email: Brevo
- Background jobs: Inngest

**Ưu điểm:**
- ✅ Optimistic UI → UX tốt
- ✅ Real-time seat selection
- ✅ Tự động hủy booking chưa thanh toán
- ✅ Email xác nhận với QR code
- ✅ Conflict detection cho shows
- ✅ Admin dashboard đầy đủ

**Cải tiến có thể làm:**
- Thêm WebSocket cho real-time seats
- Thêm notification system
- Thêm review & rating phim
- Thêm loyalty program
- Thêm mobile app

**Chuẩn bị phản biện:**
- Giải thích rõ từng nghiệp vụ
- Demo live system
- Giải thích các ràng buộc
- Giải thích cách xử lý lỗi
- Giải thích scalability

---

*Tài liệu được tạo cho mục đích phản biện luận văn tốt nghiệp - 2025*

