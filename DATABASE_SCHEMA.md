# 🗄️ DATABASE SCHEMA

## Database: MongoDB (luanvantotnghiep)

---

## 📊 Collections Overview

| Collection    | Purpose                      | Documents (Example) |
|---------------|------------------------------|---------------------|
| users         | Thông tin người dùng         | ~100-1000          |
| movies        | Thông tin phim               | ~50-200            |
| cinemahalls   | Thông tin phòng chiếu        | 5                  |
| shows         | Suất chiếu                   | ~100-500           |
| bookings      | Đặt vé                       | ~500-5000          |

---

## 1. 👤 Users Collection

### Schema
```javascript
{
  _id: String,              // Clerk User ID
  name: String,             // Tên người dùng
  email: String (unique),   // Email
  image: String,            // URL avatar
  favorites: [String],      // Array các movieId yêu thích
  createdAt: Date,          // Timestamp (auto)
  updatedAt: Date           // Timestamp (auto)
}
```

### Example Document
```json
{
  "_id": "user_2abc123xyz",
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "image": "https://img.clerk.com/...",
  "favorites": ["83533", "12345"],
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-25T14:30:00.000Z"
}
```

### Indexes
```javascript
{
  email: 1  // Unique index
}
```

---

## 2. 🎬 Movies Collection

### Schema
```javascript
{
  _id: String,              // TMDB Movie ID
  title: String,            // Tên phim
  overview: String,         // Mô tả
  poster_path: String,      // Path poster image
  backdrop_path: String,    // Path backdrop image
  genres: Array,            // Thể loại phim
  casts: Array,             // Danh sách diễn viên
  release_date: String,     // Ngày phát hành
  original_language: String, // Ngôn ngữ gốc
  tagline: String,          // Slogan
  vote_average: Number,     // Điểm đánh giá
  runtime: Number,          // Thời lượng (phút)
  trailer_key: String       // YouTube video key
}
```

### Example Document
```json
{
  "_id": "83533",
  "title": "Avatar: Fire and Ash",
  "overview": "In the wake of the devastating war...",
  "poster_path": "/8O8cZbdUg2gC6AW6R9zNjCdFNcK.jpg",
  "backdrop_path": "/...",
  "genres": [
    { "id": 878, "name": "Khoa Học Viễn Tưởng" },
    { "id": 12, "name": "Phiêu Lưu" }
  ],
  "casts": [
    {
      "id": 1234,
      "name": "Sam Worthington",
      "character": "Jake Sully",
      "profile_path": "/..."
    }
  ],
  "release_date": "2025-12-17",
  "original_language": "en",
  "tagline": "Return to Pandora",
  "vote_average": 7.4,
  "runtime": 188,
  "trailer_key": "d9MyW72ELq0"
}
```

### Indexes
```javascript
{
  title: 1,         // Text search
  release_date: -1  // Sort by newest
}
```

---

## 3. 🏛️ CinemaHalls Collection

### Schema
```javascript
{
  _id: ObjectId,            // MongoDB auto-generated
  name: String,             // Tên phòng
  hallNumber: Number (unique), // Số phòng
  type: String,             // "Standard" | "VIP" | "IMAX"
  totalSeats: Number,       // Tổng số ghế
  seatLayout: {
    rows: [String],         // ["A", "B", "C", ...]
    seatsPerRow: Number,    // Số ghế mỗi dãy
    coupleSeatsRows: [String] // Dãy có ghế đôi ["H", "J"]
  },
  customRowSeats: Object,   // Số ghế custom theo dãy
  priceMultiplier: Number,  // Hệ số giá (1, 1.5, 2)
  status: String,           // "active" | "maintenance"
  createdAt: Date,
  updatedAt: Date
}
```

### Example Document
```json
{
  "_id": "hall_id_here",
  "name": "Phòng 4 - IMAX",
  "hallNumber": 4,
  "type": "IMAX",
  "totalSeats": 100,
  "seatLayout": {
    "rows": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    "seatsPerRow": 10,
    "coupleSeatsRows": ["H", "J"]
  },
  "customRowSeats": {},
  "priceMultiplier": 2,
  "status": "active",
  "createdAt": "2025-12-01T00:00:00.000Z",
  "updatedAt": "2025-12-01T00:00:00.000Z"
}
```

### Indexes
```javascript
{
  hallNumber: 1  // Unique index
}
```

---

## 4. 📅 Shows Collection

### Schema
```javascript
{
  _id: ObjectId,              // MongoDB auto-generated
  movie: String (ref: Movie), // Movie ID
  hall: ObjectId (ref: CinemaHall), // Hall ID
  showDateTime: Date,         // Thời gian bắt đầu
  endDateTime: Date,          // Thời gian kết thúc (tính conflict)
  showPrice: Number,          // Giá vé cơ bản (VND)
  occupiedSeats: Object,      // { "A1": "userId", "A2": "userId" }
  createdAt: Date,
  updatedAt: Date
}
```

### Example Document
```json
{
  "_id": "show_id_here",
  "movie": "83533",
  "hall": "hall_id_here",
  "showDateTime": "2025-12-25T11:00:00.000Z",  // 18:00 Vietnam time
  "endDateTime": "2025-12-25T14:18:00.000Z",   // 21:18 (188 phút + 30)
  "showPrice": 80000,
  "occupiedSeats": {
    "A1": "user_abc",
    "A2": "user_abc",
    "B3": "user_xyz"
  },
  "createdAt": "2025-12-20T00:00:00.000Z",
  "updatedAt": "2025-12-24T12:30:00.000Z"
}
```

### Indexes
```javascript
{
  movie: 1,
  showDateTime: 1,
  hall: 1
}

// Compound index for conflict detection
{
  hall: 1,
  showDateTime: 1,
  endDateTime: 1
}
```

---

## 5. 🎫 Bookings Collection

### Schema
```javascript
{
  _id: ObjectId,              // MongoDB auto-generated
  user: String (ref: User),   // User ID
  show: ObjectId (ref: Show), // Show ID
  amount: Number,             // Tổng tiền (VND)
  bookedSeats: [String],      // ["A1", "A2"]
  ispaid: Boolean,            // Đã thanh toán chưa
  paymentLink: String,        // Stripe checkout URL
  createdAt: Date,            // Thời gian đặt
  updatedAt: Date
}
```

### Example Document
```json
{
  "_id": "booking_id_here",
  "user": "user_2abc123xyz",
  "show": "show_id_here",
  "amount": 360000,
  "bookedSeats": ["A1", "A2"],
  "ispaid": true,
  "paymentLink": "https://checkout.stripe.com/c/pay/cs_...",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:05:00.000Z"
}
```

### Indexes
```javascript
{
  user: 1,
  show: 1,
  ispaid: 1
}
```

---

## 📐 Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   USERS     │
│─────────────│
│ _id (PK)    │──┐
│ name        │  │
│ email       │  │
│ favorites[] │  │
└─────────────┘  │
                 │
                 │ 1:N
                 │
┌─────────────┐  │    ┌──────────────┐
│  BOOKINGS   │◄─┘    │   SHOWS      │
│─────────────│        │──────────────│
│ _id (PK)    │───────►│ _id (PK)     │
│ user (FK)   │   N:1  │ movie (FK)   │──┐
│ show (FK)   │        │ hall (FK)    │  │
│ amount      │        │ showDateTime │  │
│ bookedSeats │        │ showPrice    │  │
│ ispaid      │        │ occupiedSeats│  │
└─────────────┘        └──────────────┘  │
                                │         │
                                │         │ N:1
                                │         │
                         N:1    │    ┌────▼────────┐
                                │    │  MOVIES     │
                         ┌──────┴───┐│─────────────│
                         │CINEMAHALLS││ _id (PK)    │
                         │───────────││ title       │
                         │ _id (PK)  ││ overview    │
                         │ name      ││ runtime     │
                         │ type      ││ genres[]    │
                         │ totalSeats││ trailer_key │
                         │ seatLayout│└─────────────┘
                         └───────────┘
```

---

## 🔑 Relationships

| Parent        | Child       | Type | Foreign Key    |
|---------------|-------------|------|----------------|
| Users         | Bookings    | 1:N  | booking.user   |
| Shows         | Bookings    | 1:N  | booking.show   |
| Movies        | Shows       | 1:N  | show.movie     |
| CinemaHalls   | Shows       | 1:N  | show.hall      |

---

## 📏 Data Constraints

### Users
- `email`: UNIQUE, REQUIRED
- `name`: REQUIRED
- `_id`: Clerk User ID (String, not ObjectId)

### Movies
- `_id`: TMDB Movie ID (String)
- `title`: REQUIRED
- `runtime`: REQUIRED (số phút)

### Shows
- `showDateTime`: REQUIRED, phải >= ngày hiện tại
- `showPrice`: REQUIRED, > 0
- `movie`: REQUIRED, must exist in Movies
- `hall`: REQUIRED, must exist in CinemaHalls

### Bookings
- `user`: REQUIRED, must exist in Users
- `show`: REQUIRED, must exist in Shows
- `amount`: REQUIRED, > 0
- `bookedSeats`: REQUIRED, array không rỗng
- `ispaid`: Default false

### CinemaHalls
- `hallNumber`: UNIQUE (1-5)
- `type`: Enum ["Standard", "VIP", "IMAX"]
- `priceMultiplier`: Default 1
- `status`: Default "active"

---

## 🧮 Calculations

### 1. Show EndDateTime
```javascript
endDateTime = showDateTime + (movie.runtime + BUFFER_TIME + CLEANING_TIME) phút
// BUFFER_TIME = 10 phút
// CLEANING_TIME = 20 phút
```

### 2. Booking Amount
```javascript
basePrice = show.showPrice * hall.priceMultiplier

for each seat:
  seatPrice = basePrice
  
  // Phụ thu ghế đôi
  if (seat.row in hall.seatLayout.coupleSeatsRows):
    seatPrice += 10000
  
  // Phụ thu suất tối
  if (show.showDateTime.hour >= 17):
    seatPrice += 10000
  
  totalAmount += seatPrice
```

### 3. Booked Seats Count
```javascript
bookedSeatsCount = Object.keys(show.occupiedSeats).length
```

---

## 🔄 Data Flow

### Booking Flow
```
1. User chọn show → Get show details
2. Frontend hiển thị seat map → Get occupied seats
3. User chọn ghế → Validation
4. Create booking (isPaid = false) → Lock ghế
5. Redirect to Stripe → Payment
6. Webhook → Update isPaid = true
7. Send email với QR code
```

### Show Conflict Detection
```
1. Admin thêm show mới
2. Tính endDateTime
3. Query tìm shows trùng:
   - Cùng hall
   - Thời gian overlap:
     * Show mới bắt đầu trong show cũ
     * Show mới kết thúc trong show cũ
     * Show mới bọc show cũ
4. Nếu có conflict → Return error
5. Nếu không → Insert show
```

---

## 📊 Sample Queries

### 1. Tìm shows của 1 phim trong tương lai
```javascript
db.shows.find({
  movie: "83533",
  showDateTime: { $gte: new Date() }
}).sort({ showDateTime: 1 })
```

### 2. Tìm bookings của 1 user
```javascript
db.bookings.find({
  user: "user_2abc123xyz",
  ispaid: true
}).populate('show').sort({ createdAt: -1 })
```

### 3. Tính doanh thu tháng 12
```javascript
db.bookings.aggregate([
  {
    $match: {
      ispaid: true,
      createdAt: {
        $gte: new Date("2025-12-01"),
        $lt: new Date("2026-01-01")
      }
    }
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$amount" },
      totalBookings: { $sum: 1 }
    }
  }
])
```

### 4. Top 5 phim bán chạy
```javascript
db.bookings.aggregate([
  {
    $match: { ispaid: true }
  },
  {
    $lookup: {
      from: "shows",
      localField: "show",
      foreignField: "_id",
      as: "showData"
    }
  },
  { $unwind: "$showData" },
  {
    $group: {
      _id: "$showData.movie",
      totalBookings: { $sum: 1 },
      totalRevenue: { $sum: "$amount" }
    }
  },
  { $sort: { totalBookings: -1 } },
  { $limit: 5 }
])
```

---

## 🗑️ Data Retention

### Cleanup Policies (Khuyến nghị)

1. **Expired Stripe Sessions:**
   - Xóa bookings chưa thanh toán sau 30 phút
   - Giải phóng `occupiedSeats`

2. **Old Shows:**
   - Archive shows đã chiếu > 30 ngày
   - Giữ lại bookings (lịch sử)

3. **User Data:**
   - Xóa users không active > 1 năm
   - Cần user consent theo GDPR

---

## 💾 Backup Strategy

### Khuyến nghị

1. **Daily Backup:**
   - Automated backup mỗi ngày 2:00 AM
   - Retention: 7 ngày

2. **Weekly Backup:**
   - Mỗi Chủ Nhật
   - Retention: 4 tuần

3. **Monthly Backup:**
   - Ngày 1 hàng tháng
   - Retention: 12 tháng

### MongoDB Atlas Auto-Backup
- Continuous backup (Point-in-time restore)
- Snapshot every 12 hours

---

## 🔐 Security

### Best Practices

1. **Indexes:**
   - Tạo index cho các query thường xuyên
   - Composite index cho complex queries

2. **Connection:**
   - Sử dụng connection string có authentication
   - IP whitelist

3. **Data Validation:**
   - Schema validation ở application level
   - Mongoose validators

4. **Sensitive Data:**
   - Không lưu password (dùng Clerk)
   - Không lưu payment info (dùng Stripe)

