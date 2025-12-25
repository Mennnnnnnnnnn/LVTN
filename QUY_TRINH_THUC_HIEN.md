# QUY TRÌNH THỰC HIỆN DỰ ÁN
## Hệ thống Đặt vé Xem phim QuickShow

---

## 1. KHẢO SÁT NGHIỆP VỤ

### 1.1. Tìm hiểu nghiệp vụ rạp phim

**Khảo sát thực tế:**
- Nghiên cứu quy trình đặt vé tại các rạp phim hiện có (CGV, Lotte Cinema, Galaxy)
- Phân tích cách khách hàng đặt vé: tại quầy, website, mobile app
- Tìm hiểu cách quản lý suất chiếu, phòng chiếu, ghế ngồi
- Nghiên cứu quy trình thanh toán và xuất vé

**Phát hiện vấn đề:**
- Khách hàng phải đến quầy đặt vé → mất thời gian
- Không thể xem trước ghế còn trống
- Không thể đặt vé ngoài giờ làm việc
- Quy trình quản lý thủ công → dễ sai sót

**Đề xuất giải pháp:**
- Xây dựng hệ thống đặt vé trực tuyến 24/7
- Sơ đồ ghế trực quan, chọn ghế realtime
- Thanh toán online an toàn
- Tự động hóa quản lý suất chiếu và đặt vé

### 1.2. Xác định yêu cầu nghiệp vụ

**Yêu cầu từ phía khách hàng:**
- Xem thông tin phim đang chiếu (poster, nội dung, diễn viên, thời lượng)
- Xem lịch chiếu theo ngày và giờ
- Chọn ghế ngồi trên sơ đồ
- Thanh toán trực tuyến (thẻ tín dụng/debit)
- Nhận email xác nhận đặt vé
- Xem lịch sử đặt vé

**Yêu cầu từ phía quản lý:**
- Thêm suất chiếu mới nhanh chóng
- Xem thống kê đặt vé và doanh thu
- Quản lý danh sách suất chiếu
- Xem chi tiết từng booking

**Yêu cầu hệ thống:**
- Tránh đặt trùng ghế (race condition)
- Tự động hủy booking chưa thanh toán
- Gửi email thông báo tự động
- Bảo mật thông tin thanh toán

### 1.3. Phân tích các actor

**Actor 1: Người dùng (Customer)**
- Vai trò: Khách hàng muốn đặt vé xem phim
- Use cases: Đăng ký/Đăng nhập, Xem phim, Đặt vé, Thanh toán, Xem booking

**Actor 2: Admin**
- Vai trò: Nhân viên quản lý rạp
- Use cases: Quản lý suất chiếu, Xem thống kê, Quản lý booking

**Actor 3: Hệ thống**
- Vai trò: Xử lý tự động
- Use cases: Đồng bộ user, Hủy booking, Gửi email

### 1.4. Quy tắc nghiệp vụ

**Về đặt vé:**
- Tối đa 5 ghế mỗi lần đặt
- Không để trống đúng 1 ghế đơn (ràng buộc ghế)
- Ghế được chiếm ngay khi tạo booking
- Thời gian thanh toán: 30 phút (Stripe)
- Tự động hủy sau 10 phút nếu chưa thanh toán

**Về phòng chiếu:**
- Hệ thống có 1 phòng chiếu duy nhất
- Sơ đồ ghế cố định: 10 hàng (A-J) x 9 ghế = 90 ghế
- Tất cả ghế cùng giá (theo showPrice)

**Về thanh toán:**
- Chỉ chấp nhận thanh toán online qua Stripe
- Không hoàn tiền sau khi thanh toán thành công

---

## 2. NGHIÊN CỨU CÔNG NGHỆ

### 2.1. Lựa chọn công nghệ Frontend

**So sánh frameworks:**

| Framework | Ưu điểm | Nhược điểm | Quyết định |
|-----------|---------|------------|------------|
| **React** | Phổ biến, ecosystem lớn, component-based | Learning curve | ✅ **Chọn** |
| Vue.js | Dễ học, nhẹ | Ecosystem nhỏ hơn React | ❌ |
| Angular | Full-featured, TypeScript | Phức tạp, nặng | ❌ |

**Quyết định:** React + Vite
- **Lý do:** Phổ biến, nhiều thư viện hỗ trợ, Vite build nhanh, cộng đồng lớn

**Thư viện bổ sung:**
- **React Router:** Routing cho SPA
- **Tailwind CSS:** Styling nhanh, responsive dễ dàng
- **Axios:** HTTP client
- **React Hot Toast:** Notifications
- **Lucide React:** Icons

### 2.2. Lựa chọn công nghệ Backend

**So sánh platforms:**

| Platform | Ưu điểm | Nhược điểm | Quyết định |
|----------|---------|------------|------------|
| **Node.js** | JavaScript fullstack, async I/O | Single thread | ✅ **Chọn** |
| Django | Batteries included, ORM tốt | Python, monolithic | ❌ |
| Spring Boot | Enterprise-ready, Java | Phức tạp, nặng | ❌ |

**Quyết định:** Node.js + Express
- **Lý do:** Cùng ngôn ngữ với frontend (JavaScript), nhẹ, linh hoạt, phù hợp với event-driven

**Framework và thư viện:**
- **Express:** Web framework đơn giản, linh hoạt
- **Mongoose:** ODM cho MongoDB, schema validation

### 2.3. Lựa chọn Database

**So sánh databases:**

| Database | Ưu điểm | Nhược điểm | Quyết định |
|----------|---------|------------|------------|
| **MongoDB** | NoSQL, linh hoạt, JSON-like | Không có transaction mạnh | ✅ **Chọn** |
| PostgreSQL | ACID, relational, transaction tốt | SQL, rigid schema | ❌ |
| MySQL | Phổ biến, relational | SQL, ít tính năng hơn Postgres | ❌ |

**Quyết định:** MongoDB Atlas
- **Lý do:** Schema linh hoạt (occupiedSeats là object), JSON-like phù hợp với JavaScript, cloud-hosted (Atlas)

### 2.4. Nghiên cứu dịch vụ bên thứ ba

**Authentication: Clerk**
- Lý do chọn: Tích hợp dễ dàng, UI đẹp, hỗ trợ OAuth (Google, Facebook), quản lý user metadata
- Thay thế: Auth0, Firebase Auth, tự implement JWT

**Payment: Stripe**
- Lý do chọn: PCI-DSS compliant, Checkout Session đơn giản, webhook reliable, documentation tốt
- Thay thế: PayPal, VNPay, Momo

**Movie Data: TMDB API**
- Lý do chọn: Free, dữ liệu phong phú (poster, overview, casts, genres), cập nhật thường xuyên
- Thay thế: OMDb API, tự crawl dữ liệu

**Background Jobs: Inngest**
- Lý do chọn: Event-driven, dễ setup, serverless functions, retry tự động, cron jobs
- Thay thế: Bull Queue, Celery, tự implement với setTimeout

**Email: Brevo (Sendinblue)**
- Lý do chọn: Free tier tốt, HTTP API (Railway không chặn), transactional email
- Thay thế: SendGrid, Mailgun, AWS SES

### 2.5. Deployment

**Frontend: Vercel**
- Lý do: Free, auto-deploy từ Git, CDN toàn cầu, dễ setup

**Backend: Railway**
- Lý do: Free tier, hỗ trợ Node.js, MongoDB, environment variables dễ quản lý

**Database: MongoDB Atlas**
- Lý do: Free tier M0 (512MB), cloud-hosted, backup tự động

---

## 3. PHÂN TÍCH VÀ THIẾT KẾ DỮ LIỆU

### 3.1. Phân tích thực thể (Entities)

**Thực thể chính:**
1. **User** - Người dùng hệ thống
2. **Movie** - Phim chiếu
3. **Show** - Suất chiếu
4. **Booking** - Đơn đặt vé

### 3.2. Thiết kế mô hình dữ liệu

#### 3.2.1. User Model

```
User {
  _id: String (Clerk user ID),
  name: String,
  email: String (unique),
  image: String (URL)
}
```

**Đặc điểm:**
- `_id` là String từ Clerk (không phải ObjectId)
- Không lưu password (Clerk xử lý)
- Favorites lưu trong Clerk privateMetadata

#### 3.2.2. Movie Model

```
Movie {
  _id: String (TMDB ID),
  title: String,
  overview: String,
  poster_path: String,
  backdrop_path: String,
  release_date: String,
  original_language: String,
  tagline: String,
  genres: Array<{id, name}>,
  casts: Array<{name, profile_path}>,
  vote_average: Number,
  runtime: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Đặc điểm:**
- `_id` từ TMDB để tránh duplicate
- Dữ liệu fetch từ TMDB khi admin thêm show

#### 3.2.3. Show Model

```
Show {
  _id: ObjectId,
  movie: String (ref: Movie),
  showDateTime: Date,
  showPrice: Number,
  occupiedSeats: Object {
    "A1": "user_abc123",
    "A2": "user_abc123",
    ...
  }
}
```

**Đặc điểm:**
- `occupiedSeats` là Object (không phải Array) để O(1) lookup
- Key = tên ghế, Value = userId
- Schema có `minimize: false` để giữ structure

#### 3.2.4. Booking Model

```
Booking {
  _id: ObjectId,
  user: String (ref: User),
  show: String (ref: Show),
  amount: Number,
  bookedSeats: Array<String>,
  ispaid: Boolean (default: false),
  paymentLink: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Đặc điểm:**
- `ispaid` theo dõi trạng thái thanh toán
- `paymentLink` lưu Stripe Checkout URL

### 3.3. Quan hệ giữa các thực thể

```
User (1) ----< (N) Booking
Movie (1) ----< (N) Show
Show (1) ----< (N) Booking
```

**Mối quan hệ:**
- 1 User có nhiều Bookings
- 1 Movie có nhiều Shows (các suất chiếu khác nhau)
- 1 Show có nhiều Bookings (nhiều người đặt vé cùng suất)

### 3.4. Indexing Strategy

**Indexes cần thiết:**
```javascript
// User
User.index({ email: 1 }, { unique: true })

// Show
Show.index({ movie: 1, showDateTime: 1 })
Show.index({ showDateTime: 1 })

// Booking
Booking.index({ user: 1, createdAt: -1 })
Booking.index({ show: 1 })
Booking.index({ ispaid: 1 })
```

**Lý do:**
- `email` unique cho User lookup
- `showDateTime` để query shows sắp tới
- `user + createdAt` để lấy booking history
- `ispaid` để query unpaid bookings

### 3.5. Data Flow

**Flow đặt vé:**
1. User chọn ghế → Frontend gửi request
2. Backend kiểm tra `Show.occupiedSeats`
3. Tạo `Booking` document
4. Update `Show.occupiedSeats` (atomic operation)
5. Tạo Stripe Checkout
6. Webhook update `Booking.ispaid`

---

## 4. HIỆN THỰC CHƯƠNG TRÌNH

### 4.1. Setup môi trường phát triển

**Cài đặt công cụ:**
- Node.js v18+
- npm hoặc yarn
- MongoDB Compass (GUI cho MongoDB)
- VS Code với extensions: ESLint, Prettier, Tailwind CSS IntelliSense
- Git

**Clone và setup dự án:**
```bash
# Clone repository
git clone <repo-url>

# Setup Backend
cd server
npm install
# Tạo file .env với các keys

# Setup Frontend
cd ../client
npm install
# Tạo file .env
```

### 4.2. Phát triển Backend

**Bước 1: Setup Express Server**
- Khởi tạo Express app
- Cấu hình middleware: cors, express.json()
- Kết nối MongoDB với Mongoose
- Setup Clerk Express middleware

**Bước 2: Tạo Models**
- User model (đồng bộ từ Clerk)
- Movie model (dữ liệu từ TMDB)
- Show model (với occupiedSeats object)
- Booking model (với ispaid flag)

**Bước 3: Implement Controllers**

**showController.js:**
- `getNowPlayingMovies()` - Fetch từ TMDB API
- `addShow()` - Tạo Movie (nếu chưa có) + tạo Shows
- `getShows()` - Lấy danh sách phim đang chiếu
- `getShow()` - Chi tiết phim + lịch chiếu

**bookingController.js:**
- `getOccupiedSeats()` - Lấy ghế đã đặt
- `createBooking()` - Tạo booking + chiếm ghế + Stripe Checkout

**userController.js:**
- `getUserBookings()` - Lịch sử booking
- `updateFavorite()` - Toggle favorite
- `getFavorites()` - Danh sách favorites

**adminController.js:**
- `getDashboardData()` - Thống kê tổng quan
- `getAllShows()` - Tất cả shows
- `getAllBookings()` - Tất cả bookings

**Bước 4: Setup Routes**
- `/api/show/*` - Show routes
- `/api/booking/*` - Booking routes
- `/api/user/*` - User routes (protected)
- `/api/admin/*` - Admin routes (protected + admin only)
- `/api/stripe` - Webhook endpoint (raw body)

**Bước 5: Implement Middleware**
- `protectAdmin` - Kiểm tra role admin

**Bước 6: Setup Inngest Functions**
- `sync-user-from-clerk` - Đồng bộ user
- `release-seats-delete-booking` - Hủy booking sau 10 phút
- `send-booking-confirmation-email` - Email xác nhận
- `send-show-reminders` - Email nhắc nhở (cron)
- `send-new-show-notifications` - Email phim mới

**Bước 7: Implement Stripe Webhook**
- Verify webhook signature
- Handle `payment_intent.succeeded` event
- Update booking ispaid = true
- Trigger Inngest send email

### 4.3. Phát triển Frontend

**Bước 1: Setup React App với Vite**
- Create Vite project với React template
- Cài đặt dependencies: React Router, Tailwind, Axios, Clerk
- Cấu hình Tailwind CSS

**Bước 2: Setup Context API**
- `AppContext` - Lưu axios instance, getToken, user, shows, favorites
- Provider bao toàn bộ app

**Bước 3: Setup Routing**
```
/ - Home
/movies - Movies list
/movies/:id - Movie details
/seat-layout/:id/:date - Seat selection
/my-bookings - Booking history
/favorite - Favorite movies
/admin/dashboard - Admin dashboard
/admin/add-shows - Add shows
/admin/list-shows - List shows
/admin/list-bookings - List bookings
```

**Bước 4: Implement Components**

**Shared Components:**
- `Navbar` - Header với auth buttons
- `Footer` - Footer thông tin
- `Loading` - Loading spinner
- `MovieCard` - Card hiển thị phim
- `BlurCircle` - Decoration

**Admin Components:**
- `AdminNavbar` - Admin header
- `AdminSidebar` - Admin navigation
- `Title` - Page title

**Bước 5: Implement Pages**

**Home.jsx:**
- Hero section
- Featured movies
- Trailers section

**Movies.jsx:**
- Grid layout
- Fetch từ `/api/show/all`
- MovieCard components

**MovieDetails.jsx:**
- Poster, title, overview, casts
- Lịch chiếu group theo ngày
- DateSelect component
- Heart icon cho favorites

**SeatLayout.jsx:**
- Sidebar với giờ chiếu
- Sơ đồ ghế 10x9
- Logic chọn ghế (max 5, ràng buộc)
- Validation và call API

**MyBookings.jsx:**
- List bookings từ `/api/user/bookings`
- Hiển thị paid/unpaid status
- Link thanh toán lại

**Admin Pages:**
- Dashboard: Cards + stats
- AddShows: Fetch TMDB + form thêm shows
- ListShows: Table shows
- ListBookings: Table bookings

**Bước 6: Implement Business Logic**

**Seat validation:**
```javascript
const validateSeatRules = (selectedSeats) => {
  // Check không để trống 1 ghế bên trái
  // Check không để trống 1 ghế bên phải
  // Check không để trống 1 ghế giữa
  return {valid: true/false, message: "..."}
}
```

**Booking flow:**
```javascript
1. User chọn ghế
2. Validate rules
3. Call API /booking/create
4. Backend: Check availability
5. Backend: Create booking + occupy seats
6. Backend: Create Stripe session
7. Frontend: Redirect to Stripe
8. User pays
9. Stripe webhook → Update ispaid
10. Inngest send email
```

### 4.4. Testing

**Manual Testing:**
- Test từng trang, từng chức năng
- Test edge cases:
  - 2 users chọn cùng ghế đồng thời
  - User không thanh toán → Kiểm tra auto-cancel
  - User cancel payment → Kiểm tra redirect
  - Invalid input → Kiểm tra validation

**Browser Testing:**
- Chrome, Firefox, Safari, Edge
- Mobile responsive (375px, 768px, 1024px)

### 4.5. Deployment

**Backend (Railway):**
1. Push code lên GitHub
2. Tạo project trên Railway
3. Connect GitHub repo
4. Set environment variables
5. Deploy tự động

**Frontend (Vercel):**
1. Push code lên GitHub
2. Import project từ GitHub
3. Set environment variables (VITE_BASE_URL, VITE_CLERK_PUBLISHABLE_KEY)
4. Deploy tự động

**Webhooks:**
- Config Stripe webhook URL: `https://backend-url.railway.app/api/stripe`
- Config Inngest endpoint: `https://backend-url.railway.app/api/inngest`
- Config Clerk webhook gửi đến Inngest Cloud

### 4.6. Monitoring và Maintenance

**Sau deployment:**
- Monitor logs trên Railway
- Kiểm tra Inngest dashboard
- Xem Stripe dashboard cho payments
- Check MongoDB Atlas cho database health

**Bug fixes:**
- Fix bug `sendShowReminders` (showTime → showDateTime)
- Fix typo `bookedSeats.lenght` → `length`

---

## KẾT LUẬN

### Tổng kết quy trình

Dự án đã trải qua đầy đủ 4 giai đoạn:

1. ✅ **Khảo sát nghiệp vụ**: Phân tích quy trình đặt vé rạp phim, xác định yêu cầu và quy tắc nghiệp vụ
2. ✅ **Nghiên cứu công nghệ**: Lựa chọn tech stack phù hợp (React, Node.js, MongoDB, Clerk, Stripe, Inngest)
3. ✅ **Phân tích và thiết kế dữ liệu**: Thiết kế 4 models chính với quan hệ rõ ràng, indexing hợp lý
4. ✅ **Hiện thực chương trình**: Phát triển fullstack app, test và deploy thành công

### Kết quả đạt được

- Hệ thống hoàn chỉnh với đầy đủ chức năng đặt vé online
- Giao diện đẹp, UX mượt mà, responsive
- Tích hợp thành công 5 dịch vụ bên thứ ba
- Background jobs hoạt động ổn định
- Code clean, có documentation
- Deploy thành công lên production

### Bài học kinh nghiệm

**Kỹ thuật:**
- Event-driven architecture với Inngest rất hiệu quả
- MongoDB occupiedSeats object design giải quyết tốt vấn đề quản lý ghế
- Stripe Checkout đơn giản hơn tự implement payment form

**Nghiệp vụ:**
- Ràng buộc ghế (không để trống 1 ghế) là quy tắc thực tế và quan trọng
- Auto-cancel booking giúp tránh ghế bị "đóng băng"
- Email notifications nâng cao trải nghiệm người dùng

---

*Tài liệu quy trình thực hiện LVTN | QuickShow © 2025*

