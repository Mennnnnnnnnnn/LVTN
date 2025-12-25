  📡 API DOCUMENTATION

## Base URL
```
http://localhost:8080/api
```

---

## 🔐 Authentication

Hệ thống sử dụng **Clerk Authentication** với JWT Bearer Token.

### Headers required:
```http
Authorization: Bearer <token>
```

---

## 📌 API Endpoints

### 1. SHOW MANAGEMENT

#### 1.1. Get Now Playing Movies (Admin Only)
Lấy danh sách phim đang chiếu từ TMDB API.

```http
GET /api/show/now-playing
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "movies": [
    {
      "id": 83533,
      "title": "Avatar: Fire and Ash",
      "overview": "Mô tả phim...",
      "poster_path": "/path/to/poster.jpg",
      "vote_average": 7.4,
      "release_date": "2025-12-17"
    }
  ]
}
```

---

#### 1.2. Get All Shows
Lấy danh sách tất cả phim đang có suất chiếu.

```http
GET /api/show/all
```

**Response:**
```json
{
  "success": true,
  "shows": [
    {
      "_id": "83533",
      "title": "Avatar: Fire and Ash",
      "poster_path": "/...",
      "vote_average": 7.4
    }
  ]
}
```

---

#### 1.3. Get Show Details
Lấy chi tiết suất chiếu của một phim.

```http
GET /api/show/:movieId
```

**Parameters:**
- `movieId` (string): ID của phim

**Response:**
```json
{
  "success": true,
  "movie": {
    "_id": "83533",
    "title": "Avatar: Fire and Ash",
    "overview": "...",
    "runtime": 180,
    "genres": [...]
  },
  "dateTime": {
    "2025-12-25": [
      {
        "time": "2025-12-25T10:00:00.000Z",
        "showId": "...",
        "showPrice": 160000,
        "isEveningShow": false,
        "hall": {
          "_id": "...",
          "name": "Phòng 4 - IMAX",
          "type": "IMAX",
          "totalSeats": 100,
          "seatLayout": {
            "rows": ["A", "B", "C", ...],
            "seatsPerRow": 10,
            "coupleSeatsRows": ["H", "J"]
          },
          "customRowSeats": {},
          "priceMultiplier": 2
        }
      }
    ]
  },
  "showPrice": 160000,
  "hall": {...}
}
```

---

#### 1.4. Add Show (Admin Only)
Thêm suất chiếu mới.

```http
POST /api/show/add
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "movieId": "83533",
  "hallId": "hall_id_here",
  "showsInput": [
    {
      "date": "2025-12-25",
      "time": ["10:00", "14:00", "18:00"]
    }
  ],
  "showPrice": 80000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shows added successfully"
}
```

**Error Response (Conflict):**
```json
{
  "success": false,
  "message": "Phòng IMAX đã có lịch chiếu trùng",
  "conflicts": [
    {
      "requestedTime": "10:00",
      "conflictWith": "Avatar 2",
      "conflictTime": "09:00"
    }
  ]
}
```

---

### 2. BOOKING MANAGEMENT

#### 2.1. Get Occupied Seats
Lấy danh sách ghế đã được đặt cho một suất chiếu.

```http
GET /api/booking/seats/:showId
```

**Parameters:**
- `showId` (string): ID của suất chiếu

**Response:**
```json
{
  "success": true,
  "occupiedSeats": ["A1", "A2", "B3"]
}
```

---

#### 2.2. Create Booking
Tạo booking mới.

```http
POST /api/booking/create
```

**Headers:**
```
Authorization: Bearer <token>
Origin: http://localhost:5173
```

**Request Body:**
```json
{
  "showId": "show_id_here",
  "selectedSeats": ["A1", "A2"]
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/..."
}
```

**Validation Errors:**
```json
{
  "success": false,
  "message": "Không được bỏ trống ghế A3 giữa A2 và A4"
}
```

---

#### 2.3. Stripe Webhook
Xử lý webhook từ Stripe khi thanh toán thành công.

```http
POST /api/booking/stripe-webhook
```

**Headers:**
```
stripe-signature: <stripe_signature>
```

**Body:** Raw webhook payload from Stripe

---

### 3. USER MANAGEMENT

#### 3.1. Get User Bookings
Lấy danh sách booking của user hiện tại.

```http
GET /api/user/bookings
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "booking_id",
      "show": {
        "movie": {
          "title": "Avatar",
          "poster_path": "/...",
          "runtime": 180
        },
        "showDateTime": "2025-12-25T10:00:00.000Z"
      },
      "bookedSeats": ["A1", "A2"],
      "amount": 360000,
      "ispaid": true,
      "paymentLink": "...",
      "createdAt": "2025-12-20T..."
    }
  ]
}
```

---

#### 3.2. Update Favorite
Thêm/Xóa phim khỏi danh sách yêu thích.

```http
POST /api/user/update-favorite
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "movieId": "83533"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Movie added to favorites"
}
```

---

#### 3.3. Get Favorites
Lấy danh sách phim yêu thích.

```http
GET /api/user/favorites
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "movies": [
    {
      "_id": "83533",
      "title": "Avatar",
      "poster_path": "/..."
    }
  ]
}
```

---

### 4. ADMIN MANAGEMENT

#### 4.1. Check Admin
Kiểm tra xem user có phải admin không.

```http
GET /api/admin/is-admin
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "isAdmin": true
}
```

---

#### 4.2. Get Dashboard Data
Lấy dữ liệu thống kê cho dashboard.

```http
GET /api/admin/dashboard
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "totalRevenue": 5000000,
  "totalBookings": 25,
  "totalShows": 10,
  "totalMovies": 5,
  "activeShows": [
    {
      "movie": {...},
      "showDateTime": "...",
      "bookedSeatsCount": 15,
      "hall": {...}
    }
  ]
}
```

---

#### 4.3. Get All Bookings
Lấy tất cả booking (Admin).

```http
GET /api/admin/all-bookings
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "user": {
        "name": "Nguyễn Văn A",
        "email": "user@example.com"
      },
      "show": {
        "movie": {...},
        "showDateTime": "..."
      },
      "bookedSeats": ["A1", "A2"],
      "amount": 360000
    }
  ]
}
```

---

#### 4.4. Get All Shows
Lấy tất cả suất chiếu (Admin).

```http
GET /api/admin/all-shows
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "shows": [
    {
      "movie": {...},
      "showDateTime": "...",
      "showPrice": 80000,
      "hall": {...},
      "bookedSeatsCount": 15
    }
  ]
}
```

---

#### 4.5. Update Trailers
Cập nhật trailer cho tất cả phim.

```http
POST /api/admin/update-trailers
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Updated 10 movies successfully. 2 errors.",
  "updatedCount": 10,
  "errorCount": 2,
  "totalMovies": 12
}
```

---

### 5. CINEMA HALL MANAGEMENT

#### 5.1. Get All Cinema Halls
Lấy danh sách tất cả phòng chiếu.

```http
GET /api/hall/all
```

**Response:**
```json
{
  "success": true,
  "halls": [
    {
      "_id": "hall_id",
      "name": "Phòng 1 - Standard",
      "type": "Standard",
      "totalSeats": 90,
      "seatLayout": {
        "rows": ["A", "B", ...],
        "seatsPerRow": 9,
        "coupleSeatsRows": ["H", "J"]
      },
      "customRowSeats": {},
      "priceMultiplier": 1,
      "status": "active"
    }
  ]
}
```

---

## 🔢 Status Codes

| Code | Meaning            | Description                          |
|------|--------------------|--------------------------------------|
| 200  | OK                 | Request thành công                   |
| 400  | Bad Request        | Dữ liệu không hợp lệ                |
| 401  | Unauthorized       | Chưa đăng nhập hoặc token không hợp lệ |
| 403  | Forbidden          | Không có quyền truy cập             |
| 404  | Not Found          | Không tìm thấy resource             |
| 500  | Internal Error     | Lỗi server                          |

---

## 💡 Validation Rules

### Booking Validation
1. **Không để trống 1 ghế bên trái:**
   - ❌ Chọn: A2, A3 (trống A1)
   - ✅ Chọn: A1, A2, A3

2. **Không để trống 1 ghế bên phải:**
   - ❌ Chọn: A1, A2 (trống A3 khi có 3 ghế)
   - ✅ Chọn: A1, A2, A3

3. **Không để trống 1 ghế ở giữa:**
   - ❌ Chọn: A1, A3 (trống A2)
   - ✅ Chọn: A1, A2, A3

4. **Giới hạn số ghế:**
   - Tối đa 5 ghế/booking

5. **Ghế đôi:**
   - Click 1 ghế → Tự chọn 2 ghế liền kề

---

## 🧮 Price Calculation

```javascript
// Giá mỗi ghế
const basePrice = showPrice * hall.priceMultiplier;
let seatPrice = basePrice;

// Phụ thu ghế đôi
if (isCoupleSeatsRow) {
  seatPrice += 10000;
}

// Phụ thu suất tối (>= 17h)
if (showHour >= 17) {
  seatPrice += 10000;
}
```

---

## 🔄 Conflict Detection Algorithm

```javascript
// Tính thời gian kết thúc
const totalDuration = movie.runtime + BUFFER_TIME (10 phút) + CLEANING_TIME (20 phút);
const endDateTime = new Date(showDateTime.getTime() + totalDuration * 60000);

// Kiểm tra 3 trường hợp conflict:
1. Show mới bắt đầu khi show cũ đang chiếu
2. Show mới kết thúc khi show cũ đang chiếu
3. Show mới bọc hoàn toàn show cũ
```

---

## 📨 Webhooks

### Stripe Webhook Events

**Endpoint:** `POST /api/booking/stripe-webhook`

**Events handled:**
- `checkout.session.completed` - Thanh toán thành công
- `checkout.session.expired` - Session hết hạn

**Payload:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_...",
      "payment_status": "paid",
      "metadata": {
        "bookingId": "..."
      }
    }
  }
}
```

---

## 🧪 Testing Examples

### Test với cURL

```bash
# Get all shows
curl http://localhost:8080/api/show/all

# Get show details
curl http://localhost:8080/api/show/83533

# Create booking (with auth)
curl -X POST http://localhost:8080/api/booking/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "showId": "show_id",
    "selectedSeats": ["A1", "A2"]
  }'
```

---

## ⚠️ Error Handling

### Common Errors

**1. Seats already booked:**
```json
{
  "success": false,
  "message": "One or more selected seats are already booked"
}
```

**2. Show conflict:**
```json
{
  "success": false,
  "message": "Phòng IMAX đã có lịch chiếu trùng",
  "conflicts": [...]
}
```

**3. Validation error:**
```json
{
  "success": false,
  "message": "Không được bỏ trống ghế A2 giữa A1 và A3"
}
```

---

## 📝 Notes

- Tất cả datetime được lưu theo UTC timezone
- Currency: VND (không có decimal)
- Stripe amount: Nhân với 1 (không nhân 100 như USD)
- QR Code format: JSON string

