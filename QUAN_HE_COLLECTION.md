# 📊 QUAN HỆ GIỮA CÁC COLLECTION VÀ EMBEDDED DOCUMENTS

## 📋 TỔNG QUAN

Hệ thống có **5 collection chính**:
1. **User** - Người dùng
2. **Movie** - Phim
3. **CinemaHall** - Phòng chiếu
4. **Show** - Suất chiếu
5. **Booking** - Đặt vé

---

## 🔗 QUAN HỆ GIỮA CÁC COLLECTION (REFERENCES)

### Sơ đồ quan hệ:

```
User ──┐
       │
       ├──> Booking ──> Show ──> Movie
       │                 │
       │                 └──> CinemaHall
       │
       └──> favoriteMovies ──> Movie
```

---

## 1. QUAN HỆ ONE-TO-MANY (1 → N)

### 1.1. **User → Booking** (1 User có nhiều Booking)

**Code:**
```javascript
// Booking Model
user: { type: String, required: true, ref: 'User' }
```

**Quan hệ:**
- 1 User có thể có nhiều Booking
- 1 Booking chỉ thuộc về 1 User
- **Reference**: Booking chứa `user` (ID của User)

**Ví dụ:**
```javascript
// User có ID: "user_123"
// Booking 1: { user: "user_123", show: "show_1", ... }
// Booking 2: { user: "user_123", show: "show_2", ... }
// Booking 3: { user: "user_123", show: "show_3", ... }
```

**Sử dụng:**
```javascript
// Lấy tất cả bookings của 1 user
const bookings = await Booking.find({ user: userId })
  .populate({ path: 'show', populate: { path: 'movie' } });
```

**Mục đích:**
- Lưu trữ lịch sử đặt vé của user
- Theo dõi các booking của từng user
- Hiển thị "Vé của tôi" (MyBookings)

---

### 1.2. **Movie → Show** (1 Movie có nhiều Show)

**Code:**
```javascript
// Show Model
movie: { type: String, required: true, ref: "Movie" }
```

**Quan hệ:**
- 1 Movie có thể có nhiều Show (chiếu nhiều lần)
- 1 Show chỉ chiếu 1 Movie
- **Reference**: Show chứa `movie` (ID của Movie)

**Ví dụ:**
```javascript
// Movie có ID: "550"
// Show 1: { movie: "550", hall: "hall_1", showDateTime: "2024-01-20 10:00", ... }
// Show 2: { movie: "550", hall: "hall_2", showDateTime: "2024-01-20 14:00", ... }
// Show 3: { movie: "550", hall: "hall_1", showDateTime: "2024-01-20 18:00", ... }
```

**Sử dụng:**
```javascript
// Lấy tất cả shows của 1 movie
const shows = await Show.find({ movie: movieId })
  .populate('hall')
  .sort({ showDateTime: 1 });
```

**Mục đích:**
- 1 phim có thể chiếu nhiều lần (nhiều ngày, nhiều giờ)
- Tránh duplicate dữ liệu phim (chỉ lưu 1 lần)
- Dễ dàng cập nhật thông tin phim (chỉ cần update Movie)

---

### 1.3. **CinemaHall → Show** (1 CinemaHall có nhiều Show)

**Code:**
```javascript
// Show Model
hall: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "CinemaHall" }
```

**Quan hệ:**
- 1 CinemaHall có thể có nhiều Show (chiếu nhiều phim)
- 1 Show chỉ chiếu ở 1 CinemaHall
- **Reference**: Show chứa `hall` (ObjectId của CinemaHall)

**Ví dụ:**
```javascript
// CinemaHall có ID: "hall_1"
// Show 1: { movie: "550", hall: "hall_1", showDateTime: "2024-01-20 10:00", ... }
// Show 2: { movie: "551", hall: "hall_1", showDateTime: "2024-01-20 14:00", ... }
// Show 3: { movie: "552", hall: "hall_1", showDateTime: "2024-01-20 18:00", ... }
```

**Sử dụng:**
```javascript
// Lấy tất cả shows của 1 hall
const shows = await Show.find({ hall: hallId })
  .populate('movie');
```

**Mục đích:**
- 1 phòng có thể chiếu nhiều phim, nhiều suất
- Tránh duplicate dữ liệu phòng (chỉ lưu 1 lần)
- Dễ dàng cập nhật thông tin phòng (chỉ cần update CinemaHall)

---

### 1.4. **Show → Booking** (1 Show có nhiều Booking)

**Code:**
```javascript
// Booking Model
show: { type: String, required: true, ref: 'Show' }
```

**Quan hệ:**
- 1 Show có thể có nhiều Booking (nhiều người đặt)
- 1 Booking chỉ thuộc về 1 Show
- **Reference**: Booking chứa `show` (ID của Show)

**Ví dụ:**
```javascript
// Show có ID: "show_1"
// Booking 1: { user: "user_123", show: "show_1", bookedSeats: ["A1", "A2"], ... }
// Booking 2: { user: "user_456", show: "show_1", bookedSeats: ["B5", "B6"], ... }
// Booking 3: { user: "user_789", show: "show_1", bookedSeats: ["C10"], ... }
```

**Sử dụng:**
```javascript
// Lấy tất cả bookings của 1 show
const bookings = await Booking.find({ show: showId })
  .populate('user');
```

**Mục đích:**
- 1 suất chiếu có thể có nhiều người đặt
- Theo dõi ai đã đặt vé cho show nào
- Tính toán số ghế đã đặt, doanh thu

---

### 1.5. **Movie → User.favoriteMovies** (Many-to-Many)

**Code:**
```javascript
// User Model
favoriteMovies: [{ type: String, ref: 'Movie' }]
```

**Quan hệ:**
- 1 User có thể yêu thích nhiều Movie
- 1 Movie có thể được nhiều User yêu thích
- **Reference**: User chứa `favoriteMovies` (Array of Movie IDs)

**Ví dụ:**
```javascript
// User 1
{ _id: "user_123", favoriteMovies: ["550", "551", "552"] }

// User 2
{ _id: "user_456", favoriteMovies: ["550", "553"] }

// Movie 550 được 2 user yêu thích
```

**Sử dụng:**
```javascript
// Lấy danh sách phim yêu thích của user
const user = await User.findById(userId).populate('favoriteMovies');
```

**Mục đích:**
- Lưu trữ phim yêu thích của từng user
- Hiển thị danh sách phim yêu thích
- Tính năng "Thêm vào yêu thích"

---

## 2. COLLECTIONS ĐƯỢC LỒNG (EMBEDDED)

### 2.1. **CinemaHall.seatLayout** (Object lồng)

**Code:**
```javascript
// CinemaHall Model
seatLayout: {
    rows: { type: [String], required: true },
    seatsPerRow: { type: Number, required: true },
    coupleSeatsRows: { type: [String], default: [] },
    layoutType: { type: String, default: 'default' }
}
```

**Đặc điểm:**
- ❌ **KHÔNG phải reference** → Lồng trực tiếp trong CinemaHall
- ✅ **Embedded document** → Lưu trực tiếp trong cùng document

**Ví dụ:**
```javascript
{
  _id: "hall_1",
  name: "Phòng VIP 1",
  hallNumber: 1,
  seatLayout: {  // ← Lồng trực tiếp, không phải reference
    rows: ["A", "B", "C", "D"],
    seatsPerRow: 9,
    coupleSeatsRows: ["D"],
    layoutType: "default"
  }
}
```

**Mục đích lồng:**
1. **Truy cập nhanh**: Không cần populate, đọc trực tiếp
2. **Dữ liệu độc lập**: Sơ đồ ghế chỉ thuộc về 1 phòng, không chia sẻ
3. **Hiệu suất**: Giảm số lần query (1 query thay vì 2)
4. **Dữ liệu nhỏ**: Object nhỏ, không tốn nhiều storage

**Khi nào nên lồng:**
- ✅ Dữ liệu chỉ thuộc về 1 document
- ✅ Dữ liệu không lớn
- ✅ Cần truy cập thường xuyên cùng lúc

---

### 2.2. **CinemaHall.customRowSeats** (Object lồng)

**Code:**
```javascript
// CinemaHall Model
customRowSeats: { type: Object, default: {} }
```

**Đặc điểm:**
- ❌ **KHÔNG phải reference** → Lồng trực tiếp
- ✅ **Embedded document**

**Ví dụ:**
```javascript
{
  _id: "hall_1",
  customRowSeats: {  // ← Lồng trực tiếp
    "A": 6,
    "B": 8,
    "C": 10
  }
}
```

**Mục đích lồng:**
- Giống `seatLayout`: Dữ liệu chỉ thuộc về 1 phòng
- Truy cập nhanh, không cần populate
- Dữ liệu nhỏ

---

### 2.3. **Show.occupiedSeats** (Object lồng)

**Code:**
```javascript
// Show Model
occupiedSeats: { type: Object, default: {} }
```

**Đặc điểm:**
- ❌ **KHÔNG phải reference** → Lồng trực tiếp
- ✅ **Embedded document**

**Ví dụ:**
```javascript
{
  _id: "show_1",
  movie: "550",
  hall: "hall_1",
  occupiedSeats: {  // ← Lồng trực tiếp
    "A1": "user_123",
    "A2": "user_123",
    "B5": "user_456",
    "C10": "user_789"
  }
}
```

**Cấu trúc:**
- Key: Tên ghế (ví dụ: "A1", "B5")
- Value: ID người dùng đã đặt ghế đó

**Mục đích lồng:**
1. **Truy cập nhanh**: Cần đọc `occupiedSeats` mỗi khi đặt vé
2. **Dữ liệu độc lập**: Ghế đã đặt chỉ thuộc về 1 show
3. **Hiệu suất**: Giảm query (không cần join với collection khác)
4. **Cập nhật thường xuyên**: Khi đặt vé → update `occupiedSeats` ngay
5. **Atomic update**: Có thể update trực tiếp trong 1 transaction

**Khi nào nên lồng:**
- ✅ Dữ liệu thay đổi thường xuyên (mỗi khi đặt vé)
- ✅ Dữ liệu chỉ thuộc về 1 document
- ✅ Cần truy cập nhanh

---

### 2.4. **Movie.genres** (Array lồng)

**Code:**
```javascript
// Movie Model
genres: { type: Array, required: true }
```

**Đặc điểm:**
- ❌ **KHÔNG phải reference** → Lồng trực tiếp
- ✅ **Embedded array**

**Ví dụ:**
```javascript
{
  _id: "550",
  title: "Fight Club",
  genres: [  // ← Lồng trực tiếp
    { id: 18, name: "Drama" },
    { id: 80, name: "Crime" }
  ]
}
```

**Mục đích lồng:**
1. **Dữ liệu nhỏ**: Genres là array nhỏ
2. **Không thay đổi**: Genres của phim không thay đổi
3. **Truy cập thường xuyên**: Cần hiển thị genres mỗi khi show phim
4. **Đơn giản**: Không cần collection riêng

**Lưu ý:**
- Nếu có nhiều phim cùng 1 genre → Có thể tạo collection Genre riêng
- Nhưng với dữ liệu nhỏ, lồng vẫn tốt hơn

---

### 2.5. **Movie.casts** (Array lồng)

**Code:**
```javascript
// Movie Model
casts: { type: Array, required: true }
```

**Đặc điểm:**
- ❌ **KHÔNG phải reference** → Lồng trực tiếp
- ✅ **Embedded array**

**Ví dụ:**
```javascript
{
  _id: "550",
  title: "Fight Club",
  casts: [  // ← Lồng trực tiếp
    { id: 819, name: "Edward Norton", character: "The Narrator" },
    { id: 287, name: "Brad Pitt", character: "Tyler Durden" }
  ]
}
```

**Mục đích lồng:**
- Giống `genres`: Dữ liệu nhỏ, không thay đổi, truy cập thường xuyên

---

### 2.6. **Booking.bookedSeats** (Array lồng)

**Code:**
```javascript
// Booking Model
bookedSeats: { type: Array, required: true }
```

**Đặc điểm:**
- ❌ **KHÔNG phải reference** → Lồng trực tiếp
- ✅ **Embedded array**

**Ví dụ:**
```javascript
{
  _id: "booking_1",
  user: "user_123",
  show: "show_1",
  bookedSeats: ["A1", "A2", "B5"]  // ← Lồng trực tiếp
}
```

**Mục đích lồng:**
1. **Dữ liệu nhỏ**: Array ngắn (tối đa 5 ghế)
2. **Dữ liệu độc lập**: Ghế đã đặt chỉ thuộc về 1 booking
3. **Truy cập thường xuyên**: Cần hiển thị ghế đã đặt
4. **Đơn giản**: Không cần collection riêng cho từng ghế

---

## 📊 TỔNG KẾT QUAN HỆ

### References (Tham chiếu):

| Collection chứa | Trường | Reference đến | Quan hệ |
|----------------|--------|---------------|---------|
| Booking | `user` | User | Many-to-One |
| Booking | `show` | Show | Many-to-One |
| Show | `movie` | Movie | Many-to-One |
| Show | `hall` | CinemaHall | Many-to-One |
| User | `favoriteMovies[]` | Movie | Many-to-Many |

### Embedded (Lồng):

| Collection | Trường lồng | Kiểu | Mục đích |
|-----------|------------|------|----------|
| CinemaHall | `seatLayout` | Object | Sơ đồ ghế (truy cập nhanh, dữ liệu nhỏ) |
| CinemaHall | `customRowSeats` | Object | Số ghế tùy chỉnh (truy cập nhanh) |
| Show | `occupiedSeats` | Object | Ghế đã đặt (truy cập nhanh, update thường xuyên) |
| Movie | `genres` | Array | Thể loại (dữ liệu nhỏ, không thay đổi) |
| Movie | `casts` | Array | Diễn viên (dữ liệu nhỏ, không thay đổi) |
| Booking | `bookedSeats` | Array | Ghế đã đặt (dữ liệu nhỏ, độc lập) |

---

## 🎯 NGUYÊN TẮC QUYẾT ĐỊNH LỒNG HAY REFERENCE

### ✅ Nên LỒNG (Embed) khi:
1. **Dữ liệu nhỏ**: Object/Array không quá lớn (< 16MB)
2. **Dữ liệu độc lập**: Chỉ thuộc về 1 document
3. **Truy cập thường xuyên**: Cần đọc cùng lúc với document chính
4. **Không chia sẻ**: Dữ liệu không được chia sẻ giữa nhiều documents
5. **Update thường xuyên**: Cần update cùng lúc với document chính

**Ví dụ:**
- `seatLayout`: Chỉ thuộc về 1 phòng, cần đọc mỗi khi load phòng
- `occupiedSeats`: Chỉ thuộc về 1 show, update mỗi khi đặt vé

### ✅ Nên REFERENCE khi:
1. **Dữ liệu lớn**: Document lớn (> 16MB)
2. **Chia sẻ**: Dữ liệu được chia sẻ giữa nhiều documents
3. **Update độc lập**: Cần update riêng biệt
4. **Quan hệ phức tạp**: Many-to-Many, Many-to-One

**Ví dụ:**
- `Show.movie`: 1 movie có nhiều shows, có thể update movie riêng
- `Show.hall`: 1 hall có nhiều shows, có thể update hall riêng
- `Booking.user`: 1 user có nhiều bookings

---

## 🔍 VÍ DỤ QUERY VỚI POPULATE

### Lấy booking với đầy đủ thông tin:

```javascript
const booking = await Booking.findById(bookingId)
  .populate('user')  // Populate User
  .populate({
    path: 'show',
    populate: [
      { path: 'movie' },      // Populate Movie
      { path: 'hall' }        // Populate CinemaHall
    ]
  });

// Kết quả:
{
  _id: "booking_1",
  user: {
    _id: "user_123",
    name: "Nguyễn Văn A",
    email: "a@example.com"
  },
  show: {
    _id: "show_1",
    movie: {
      _id: "550",
      title: "Fight Club",
      poster_path: "/..."
    },
    hall: {
      _id: "hall_1",
      name: "Phòng VIP 1",
      seatLayout: { ... },  // ← Embedded, không cần populate
      totalSeats: 72
    },
    showDateTime: "2024-01-20T10:00:00Z",
    occupiedSeats: { ... }  // ← Embedded, không cần populate
  },
  bookedSeats: ["A1", "A2"],  // ← Embedded, không cần populate
  amount: 300000
}
```

---

## 📝 LƯU Ý QUAN TRỌNG

1. **Embedded documents KHÔNG cần populate**: Dữ liệu đã có sẵn trong document
2. **References CẦN populate**: Cần `.populate()` để lấy dữ liệu từ collection khác
3. **Tối ưu hiệu suất**: 
   - Embedded: Truy cập nhanh, nhưng tăng kích thước document
   - Reference: Tiết kiệm storage, nhưng cần nhiều query
4. **Atomic updates**: Embedded có thể update cùng lúc, Reference cần update riêng

---

**Tài liệu này giải thích toàn bộ quan hệ và embedded documents trong hệ thống!** 🎉

