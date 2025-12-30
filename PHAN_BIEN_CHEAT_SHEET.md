  # 🎯 CHEAT SHEET PHẢN BIỆN - HỆ THỐNG ĐẶT VÉ XEM PHIM

## 📋 MỤC LỤC
1. [Ràng buộc chọn ghế](#1-ràng-buộc-chọn-ghế)
2. [Ràng buộc thêm suất chiếu](#2-ràng-buộc-thêm-suất-chiếu-addshow)
3. [Các chức năng User](#3-các-chức-năng-user)
4. [Các chức năng Admin](#4-các-chức-năng-admin)
5. [Xử lý nghiệp vụ phức tạp](#5-xử-lý-nghiệp-vụ-phức-tạp)
6. [Câu trả lời mẫu cho giảng viên](#6-câu-trả-lời-mẫu-cho-giảng-viên)

---

## 1. RÀNG BUỘC CHỌN GHẾ

### 1.1. Ràng buộc cơ bản
| Ràng buộc | Giá trị | Lý do |
|-----------|---------|-------|
| **Số ghế tối đa** | 5 ghế | Tránh scalper mua hàng loạt |
| **Ghế đôi** | Phải chọn cặp (2 ghế) | Đảm bảo trải nghiệm couple seat |
| **Ghế đã đặt** | Không cho chọn | Tránh conflict booking |
| **Chọn suất chiếu** | Bắt buộc trước khi chọn ghế | UX logic flow |

### 1.2. Quy tắc "Không bỏ trống 1 ghế" (Critical!)

**VẤN ĐỀ:** Nếu để trống đúng 1 ghế, người sau không thể đặt (vì tối thiểu phải đặt 2 ghế hoặc 1 ghế couple = 2 ghế)

**GIẢI PHÁP:** Validate 3 trường hợp

#### Trường hợp 1: Trống 1 ghế bên TRÁI
```
Sơ đồ:
[  ] [X] [X] [X] ...
 ↑
 Ghế trống (KHÔNG HỢP LỆ)

Ví dụ lỗi: Chọn A2, A3, A4 → Bỏ trống A1
Message: "Không được bỏ trống ghế A1 bên trái"
```

**CODE:**
```javascript
if (min > 1 && min - 1 === 1) {
  return {
    valid: false,
    message: `Không được bỏ trống ghế ${row}${min - 1} bên trái`
  };
}
```

#### Trường hợp 2: Trống 1 ghế bên PHẢI
```
Sơ đồ:
... [X] [X] [X] [  ]
                 ↑
            Ghế trống (KHÔNG HỢP LỆ)

Ví dụ lỗi: Dãy có 9 ghế, chọn A7, A8 → Bỏ trống A9
Message: "Không được bỏ trống ghế A9 bên phải"
```

**CODE:**
```javascript
if (max < TOTAL_SEATS_PER_ROW && TOTAL_SEATS_PER_ROW - max === 1) {
  return {
    valid: false,
    message: `Không được bỏ trống ghế ${row}${max + 1} bên phải`
  };
}
```

#### Trường hợp 3: Trống 1 ghế Ở GIỮA
```
Sơ đồ:
[X] [X] [  ] [X] [X]
         ↑
    Ghế trống (KHÔNG HỢP LỆ)

Ví dụ lỗi: Chọn A2, A3, A5, A6 → Bỏ trống A4
Message: "Không được bỏ trống ghế A4 giữa A3 và A5"
```

**CODE:**
```javascript
for (let i = 0; i < nums.length - 1; i++) {
  if (nums[i + 1] - nums[i] === 2) {
    return {
      valid: false,
      message: `Không được bỏ trống ghế ${row}${nums[i] + 1} giữa ${row}${nums[i]} và ${row}${nums[i + 1]}`
    };
  }
}
```

### 1.3. Ghế đôi (Couple Seats)

**LOGIC:**
- Ghế được gom thành CẶP (số lẻ + số chẵn): (1,2), (3,4), (5,6)...
- Click vào **BẤT KỲ** ghế nào trong cặp → Chọn/bỏ **CẢ 2 GHẾ**
- Nếu 1 trong 2 ghế đã bị đặt → Không cho chọn cả cặp

**VALIDATION:**
```javascript
const isCoupleSeat = hall?.seatLayout?.coupleSeatsRows?.includes(row);

if(isCoupleSeat) {
  // Tính ghế còn lại trong cặp
  const seatNum = parseInt(seatId.slice(1));
  const isOddSeat = seatNum % 2 === 1;
  const coupleSeat = isOddSeat ? `${row}${seatNum + 1}` : `${row}${seatNum - 1}`;
  
  // Check cả 2 ghế
  if(occupiedSeats.includes(seatId) || occupiedSeats.includes(coupleSeat)){
    return toast("Ghế đôi đã được đặt trước đó");
  }
  
  // Giới hạn: ghế đôi tính = 2 ghế → max 4 ghế (2 cặp)
  if(!selectedSeats.includes(seatId) && selectedSeats.length > 3) {
    return toast("Bạn có thể chọn tối đa 5 ghế ngồi");
  }
}
```

### 1.4. Tính giá ghế (Price Calculation)

**CÔNG THỨC:**
```
Giá ghế = Base Price × Hall Multiplier + Phụ thu ghế đôi + Phụ thu suất tối
```

**CHI TIẾT:**

| Thành phần | Giá trị | Áp dụng |
|------------|---------|---------|
| **Base Price** | 50,000 VNĐ | Tất cả ghế |
| **Hall Multiplier** | 1.0 - 1.5x | VIP hall = 1.5x, Thường = 1.0x |
| **Phụ thu ghế đôi** | +10,000 VNĐ/ghế | Chỉ dãy ghế đôi |
| **Phụ thu suất tối** | +10,000 VNĐ/ghế | Show sau 17:00 |

**VÍ DỤ TÍNH:**
```
Suất chiếu: 18:00 (suất tối ✓)
Phòng: VIP Hall (multiplier = 1.5)
Ghế chọn: E1, E2 (ghế đôi)

Tính cho MỖI GHẾ:
= 50,000 × 1.5 + 10,000 (couple) + 10,000 (evening)
= 75,000 + 10,000 + 10,000
= 95,000 VNĐ/ghế

Tổng 2 ghế: 95,000 × 2 = 190,000 VNĐ
```

**CODE:**
```javascript
const basePrice = showData.showPrice * showData.hall.priceMultiplier;
const showHour = showData.showDateTime.getHours();
const isEveningShow = showHour >= 17;

let totalAmount = 0;
selectedSeats.forEach(seat => {
    let seatPrice = basePrice;
    
    // Phụ thu ghế đôi
    const row = seat[0];
    if(showData.hall.seatLayout?.coupleSeatsRows?.includes(row)) {
        seatPrice += COUPLE_SEAT_SURCHARGE; // +10,000
    }
    
    // Phụ thu suất tối
    if(isEveningShow) {
        seatPrice += EVENING_SURCHARGE; // +10,000
    }
    
    totalAmount += seatPrice;
});
```

### 1.5. Reset ghế khi chuyển suất chiếu

**VẤN ĐỀ:** User chọn ghế ở suất 14:00, rồi click sang suất 18:00 → Ghế cũ vẫn selected → Sai logic!

**GIẢI PHÁP:** Reset `selectedSeats = []` khi `selectedTime` thay đổi

**CODE:**
```javascript
// Effect 1: Update hall info
useEffect(() => {
  if(selectedTime?.hall) {
    setHall(selectedTime.hall);
    setCurrentShowPrice(selectedTime.showPrice || show?.showPrice || 0);
    setIsEveningShow(selectedTime.isEveningShow || false);
  }
}, [selectedTime, show]);

// Effect 2: Reset ghế đã chọn
useEffect(() => {
  if(selectedTime) {
    setSelectedSeats([]); // ✨ CLEAR SEATS
  }
}, [selectedTime?.showId]); // Track showId để trigger khi đổi suất
```

**LÝ DO TÁCH 2 EFFECT:**
- Tránh stale closure
- Dependencies rõ ràng
- Mỗi effect làm 1 việc (Single Responsibility)

---

## 2. RÀNG BUỘC THÊM SUẤT CHIẾU (addShow)

### 2.1. Buffer Time & Cleaning Time

**CÔNG THỨC THỜI GIAN:**
```
Thời gian kết thúc = Thời gian bắt đầu + Runtime + Buffer + Cleaning
                   = Start Time + Runtime + 20 phút + 10 phút
```

| Thành phần | Thời gian | Mục đích |
|------------|-----------|----------|
| **Runtime** | Tùy phim | Thời lượng phim thực tế |
| **Buffer Time** | 20 phút | Quảng cáo, trailer, intro |
| **Cleaning Time** | 10 phút | Dọn dẹp, chuẩn bị hall |
| **TỔNG CỘNG** | Runtime + 30 phút | Thời gian "chiếm" hall |

**VÍ DỤ:**
```
Phim: Avengers (180 phút = 3 giờ)
Suất chiếu: 14:00

Tính:
- Bắt đầu: 14:00
- Kết thúc: 14:00 + 180 + 20 + 10 = 14:00 + 210 phút = 17:30

→ Hall bị "chiếm" từ 14:00 đến 17:30
```

**CODE:**
```javascript
const BUFFER_TIME = 20; // phút
const CLEANING_TIME = 10; // phút
const totalDuration = movie.runtime + BUFFER_TIME + CLEANING_TIME;

const showDateTime = new Date(dateTimeString);
const endDateTime = new Date(showDateTime.getTime() + totalDuration * 60000);
```

### 2.2. Conflict Detection (Phát hiện trùng lịch)

**2 LOẠI CONFLICT:**
1. **DB Conflict:** Trùng với show đã có trong database
2. **Internal Conflict:** Trùng với show khác trong cùng request thêm

### 2.2.1. DB Conflict Detection

**LOGIC OVERLAP:**
Hai khoảng thời gian [A1, A2] và [B1, B2] overlap khi:
```
A1 < B2 AND B1 < A2
```

**MINH HỌA:**
```
✅ KHÔNG CONFLICT (có khoảng cách):
Show A: |-------|         (10:00 - 13:30)
Show B:            |------| (14:00 - 17:30)
        10:00 13:30 14:00 17:30

❌ CONFLICT (overlap):
Show A: |-------|           (10:00 - 13:30)
Show B:      |-------|      (12:00 - 15:30)
        10:00 12:00 13:30 15:30
        
❌ CONFLICT (cùng thời gian):
Show A: |-------|           (14:00 - 17:30)
Show B: |-------|           (14:00 - 17:30)
```

**CODE:**
```javascript
const conflictingShows = await Show.find({
    hall: hallId,
    $or: [
        // New show starts during existing show
        {
            showDateTime: { $lte: showDateTime },
            endDateTime: { $gt: showDateTime }
        },
        // New show ends during existing show
        {
            showDateTime: { $lt: endDateTime },
            endDateTime: { $gte: endDateTime }
        },
        // New show completely overlaps existing show
        {
            showDateTime: { $gte: showDateTime },
            endDateTime: { $lte: endDateTime }
        }
    ]
}).populate('movie');
```

### 2.2.2. Internal Conflict Detection (CRITICAL!)

**VẤN ĐỀ:** Admin thêm nhiều suất chiếu CÙNG LÚC trong 1 request:
```
Request: Thêm 2 suất cho phim 3 giờ tại Hall 1:
- Suất 1: 14:00
- Suất 2: 15:00

❌ VẤN ĐỀ: 
- Suất 1: 14:00 - 17:30
- Suất 2: 15:00 - 18:30
→ Overlap 2.5 giờ!

Nhưng DB chưa có → Check DB không phát hiện được!
```

**GIẢI PHÁP:** Check với các show đã collect trong `showsToCreate` array

**CODE:**
```javascript
const showsToCreate = []; // Lưu các show đã validate

for (const show of showsInput) {
    for (const time of show.time) {
        // ... tính showDateTime, endDateTime ...
        
        // 1. Check DB conflict (như trên)
        
        // 2. Check INTERNAL conflict
        const internalConflict = showsToCreate.find(existingShow => {
            const existingStart = existingShow.showDateTime.getTime();
            const existingEnd = existingShow.endDateTime.getTime();
            const newStart = showDateTime.getTime();
            const newEnd = endDateTime.getTime();
            
            // Overlap: newStart < existingEnd AND existingStart < newEnd
            return newStart < existingEnd && existingStart < newEnd;
        });
        
        if (internalConflict) {
            conflicts.push({
                requestedTime: time,
                requestedDate: showDate,
                conflictWith: movie.title,
                reason: `Trùng với suất chiếu ${conflictStart} - ${conflictEnd} (cùng lần thêm)`
            });
            continue;
        }
        
        // 3. Không conflict → Add vào list
        showsToCreate.push({
            movie: movieId,
            hall: hallId,
            showDateTime,
            endDateTime,
            showPrice,
            occupiedSeats: {},
        });
    }
}
```

### 2.3. Test Cases cho Conflict Detection

**SETUP:**
- Phim: 180 phút
- Total duration: 210 phút (3.5 giờ)
- Hall: VIP Hall 1

| Test Case | Show A | Show B | Kết quả | Lý do |
|-----------|--------|--------|---------|-------|
| 1 | 10:00-13:30 | 14:00-17:30 | ✅ PASS | Cách 30 phút |
| 2 | 10:00-13:30 | 13:30-17:00 | ✅ PASS | Liền kề (không overlap) |
| 3 | 10:00-13:30 | 12:00-15:30 | ❌ FAIL | Overlap 1.5h |
| 4 | 14:00-17:30 | 15:00-18:30 | ❌ FAIL | Overlap 2.5h |
| 5 | 14:00-17:30 | 14:00-17:30 | ❌ FAIL | Cùng time |
| 6 | 14:00-17:30 | 16:00-19:30 | ❌ FAIL | Overlap 1.5h |

### 2.4. UI Feedback cho Admin

**HIỂN THỊ THÔNG TIN:**
```
Khi hover vào poster phim:
┌─────────────────────────┐
│ 🎬 Avengers             │
│                         │
│ ⏱️ Thời lượng: 180'     │
│ 📦 Buffer: +30'         │
│ ⏰ Tổng: 210' (3.5h)    │
│                         │
│ 🎭 Action, Adventure    │
└─────────────────────────┘
```

**HIỂN THỊ SUẤT CHIẾU ĐÃ CHỌN:**
```
Danh sách suất chiếu:
✓ 10/01/2025 - 14:00 → 17:30 (210')
✓ 10/01/2025 - 18:00 → 21:30 (210')
✓ 11/01/2025 - 20:00 → 23:30 (210')
```

**ERROR MESSAGE:**
```
❌ Phát hiện 1 xung đột lịch chiếu tại VIP Hall 1

Chi tiết:
- 10/01/2025 15:00 - Trùng với suất chiếu 14:00 - 17:30 (cùng lần thêm)

Giải thích: Phim dài 3.5 giờ, cần khoảng cách tối thiểu 3.5 giờ giữa các suất.
```

---

## 3. CÁC CHỨC NĂNG USER

### 3.1. Authentication & Profile

**CÔNG NGHỆ:** Clerk (OAuth)
- Đăng nhập Google/GitHub
- Session management tự động
- JWT token cho API calls

**CHỨC NĂNG:**
- Xem profile
- Cập nhật ảnh đại diện (từ OAuth provider)
- Quản lý email notifications

### 3.2. Browse Movies

**TRANG CHỦ:**
- Hiển thị phim đang chiếu (Now Playing)
- Fetch từ TMDB API (themoviedb.org)
- Giới hạn 20 phim đầu tiên
- Cache runtime và genres trong DB

**TRANG MOVIES:**
- Tất cả phim trong hệ thống
- Search theo tên
- Filter theo genre
- Sắp xếp theo rating/release date

### 3.3. Movie Details

**THÔNG TIN HIỂN THỊ:**
- Poster, backdrop
- Title, overview, tagline
- Runtime, release date
- Genres, rating (vote_average)
- Cast (từ TMDB API)

**ACTIONS:**
- ❤️ Thêm/bỏ yêu thích (Favorite)
- 🎫 Xem lịch chiếu
- 📅 Chọn ngày & giờ đặt vé

### 3.4. Favorite System

**LƯU TRỮ:** MongoDB User model
```javascript
const userSchema = new mongoose.Schema({
    _id: String,
    name: String,
    email: String,
    image: String,
    favoriteMovies: [{ type: String, ref: 'Movie' }] // Array of movie IDs
}, { timestamps: true });
```

**OPTIMISTIC UI:**
1. User click ❤️
2. **Ngay lập tức** update UI (thêm/bỏ khỏi favorites)
3. Call API trong background
4. Nếu **thành công** → Giữ nguyên, show toast
5. Nếu **lỗi** → Rollback UI, show error toast

**CODE:**
```javascript
const handleFavorite = async () => {
  const newIsFavorited = !isFavorited;
  
  // 1. Optimistic update
  setIsFavorited(newIsFavorited);
  setFavoriteMovies(prev => 
    newIsFavorited 
      ? [...prev, id] 
      : prev.filter(movieId => movieId !== id)
  );
  
  // 2. Call API
  axios.post('/api/user/update-favorite', { movieId: id }, {
    headers: { Authorization: `Bearer ${await getToken()}` }
  })
  .then(data => {
    toast.success(newIsFavorited 
      ? "Đã thêm vào yêu thích thành công" 
      : "Đã hủy yêu thích thành công"
    );
  })
  .catch(error => {
    // 3. Rollback on error
    setIsFavorited(!newIsFavorited);
    setFavoriteMovies(prev => 
      newIsFavorited 
        ? prev.filter(movieId => movieId !== id)
        : [...prev, id]
    );
    toast.error("Có lỗi xảy ra");
  });
};
```

### 3.5. Booking Flow

**BƯỚC 1: Chọn suất chiếu**
- Chọn ngày (date picker)
- Chọn giờ (available showtimes)
- Hiển thị giá base và phòng chiếu

**BƯỚC 2: Chọn ghế**
- Load sơ đồ ghế của hall
- Hiển thị ghế đã đặt (màu xám)
- Chọn ghế theo quy tắc (như mục 1)
- Tính tiền real-time

**BƯỚC 3: Thanh toán**
- Tạo booking trong DB (status: pending)
- Tạo Stripe Checkout Session
- Redirect đến Stripe
- Session expires sau 30 phút

**BƯỚC 4: Xác nhận**
- Stripe webhook → Update booking status
- Gửi email xác nhận + QR code
- Hiển thị trong "My Bookings"

**RACE CONDITION HANDLING:**
```javascript
// Check seats availability ngay trước khi tạo booking
const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

if(!isAvailable){
    return res.json({
        success: false, 
        message: 'One or more selected seats are already booked. Please choose different seats.'
    });
}
```

### 3.6. My Bookings

**THÔNG TIN HIỂN THỊ:**
- Tên phim, poster
- Ngày giờ chiếu
- Phòng chiếu
- Ghế đã đặt
- Tổng tiền
- Trạng thái thanh toán
- QR code (nếu đã thanh toán)

**TRẠNG THÁI:**
- 🟡 **Pending:** Chưa thanh toán, có link payment
- 🟢 **Paid:** Đã thanh toán, có QR code
- 🔴 **Cancelled:** Hết hạn 30 phút chưa thanh toán

**AUTO-CANCELLATION:**
- Inngest function chạy sau 10 phút tạo booking
- Check Stripe payment status
- Nếu chưa thanh toán → Hủy booking, free seats

---

## 4. CÁC CHỨC NĂNG ADMIN

### 4.1. Dashboard (Tổng quan)

**CARDS THỐNG KÊ:**
- 💰 Tổng doanh thu (VNĐ)
- 🎫 Tổng số đặt chỗ
- 🎬 Tổng số phim
- 👥 Tổng số người dùng

**BIỂU ĐỒ:**
- Revenue Chart (7 ngày gần nhất)
- Bookings Chart (theo ngày)

**BẢNG LATEST BOOKINGS:**
- 5 booking gần nhất
- Hiển thị khách hàng, phim, thời gian, số tiền

### 4.2. List Movies (Quản lý phim)

**CHỨC NĂNG:**
- Xem tất cả phim trong hệ thống
- Fetch từ TMDB khi cần thiết
- Hiển thị runtime, genres, rating

**LƯU Ý:** Phim được thêm tự động khi admin tạo show. Không có chức năng "Xóa phim" vì ảnh hưởng đến:
- Bookings đã tồn tại
- Shows đã tạo
- Favorites của users

### 4.3. Add Shows (Thêm suất chiếu)

**QUY TRÌNH:**

**BƯỚC 1:** Search phim từ TMDB
- Input: Tên phim
- API: `https://api.themoviedb.org/3/search/movie`
- Hiển thị: Poster, title, year, runtime, genres

**BƯỚC 2:** Chọn phòng chiếu (Hall)
- Dropdown list halls
- Hiển thị: Hall name, capacity, priceMultiplier

**BƯỚC 3:** Nhập giá base (VNĐ)
- Default: 50,000 VNĐ
- Min: 30,000 VNĐ
- Max: 150,000 VNĐ

**BƯỚC 4:** Chọn ngày & giờ
- Multiple dates: Checkbox list
- Multiple times: Checkbox list (10:00, 13:00, 15:00, 17:00, 20:00, 22:00)

**BƯỚC 5:** Review & Submit
- Hiển thị tất cả suất sẽ tạo với endTime
- Hover poster → Xem runtime và total duration
- Click "Thêm" → Validate conflicts → Insert DB

**SAU KHI THÊM THÀNH CÔNG:**
- Nếu phim MỚI lần đầu → Gửi email thông báo đến tất cả users
- Nếu phim ĐÃ CÓ → Không gửi email (tránh spam)

### 4.4. List Shows (Danh sách suất chiếu)

**CHỨC NĂNG:**
- Xem tất cả shows (future & past)
- Filter theo:
  - Ngày (date range picker)
  - Phim (dropdown)
  - Phòng chiếu (dropdown)
- Xóa show (nếu chưa có booking)

**RÀNG BUỘC XÓA:**
```javascript
if (show.occupiedSeats && Object.keys(show.occupiedSeats).length > 0) {
    return res.json({
        success: false, 
        message: 'Không thể xóa suất chiếu đã có người đặt vé'
    });
}
```

### 4.5. List Bookings (Danh sách đặt chỗ)

**HIỂN THỊ:**
- Tên khách hàng
- Email
- Tên phim
- Ngày giờ chiếu
- Phòng chiếu
- Ghế đã đặt
- Số tiền
- Trạng thái thanh toán (Đã thanh toán / Chưa thanh toán)
- Thời gian đặt

**FILTERS (Quan trọng cho quản lý):**

1. **Trạng thái thanh toán:**
   - Tất cả
   - Đã thanh toán (🟢)
   - Chưa thanh toán (🟡)

2. **Khoảng thời gian đặt vé:**
   - Tất cả
   - Hôm nay
   - 7 ngày qua
   - 30 ngày qua

3. **Tìm kiếm tên khách hàng:**
   - Input search box
   - Filter real-time (không case-sensitive)

4. **Lọc theo phim:**
   - Dropdown (dynamic từ bookings)
   - Options: Tất cả + list unique movies

5. **Lọc theo phòng chiếu:**
   - Dropdown (dynamic từ bookings)
   - Options: Tất cả + list unique halls

**CODE FILTER:**
```javascript
const filteredBookings = useMemo(() => {
  return bookings.filter(booking => {
    // 1. Payment status
    if(filter === 'paid' && !booking.paymentStatus) return false;
    if(filter === 'unpaid' && booking.paymentStatus) return false;
    
    // 2. Time range
    if(timeFilter !== 'all') {
      const bookingDate = new Date(booking.createdAt);
      const now = new Date();
      const diffDays = (now - bookingDate) / (1000 * 60 * 60 * 24);
      
      if(timeFilter === 'today' && diffDays > 1) return false;
      if(timeFilter === '7days' && diffDays > 7) return false;
      if(timeFilter === '30days' && diffDays > 30) return false;
    }
    
    // 3. Customer name search
    if(searchTerm && !booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // 4. Movie filter
    if(selectedMovieFilter !== 'all' && booking.show?.movie?._id !== selectedMovieFilter) {
      return false;
    }
    
    // 5. Hall filter
    if(selectedHallFilter !== 'all' && booking.show?.hall?._id !== selectedHallFilter) {
      return false;
    }
    
    return true;
  });
}, [bookings, filter, timeFilter, searchTerm, selectedMovieFilter, selectedHallFilter]);
```

**BUTTON ACTIONS:**
- "Xóa bộ lọc" → Reset tất cả filters về default
- Hiển thị count: "X / Y đặt chỗ" (filtered / total)

### 4.6. List Users (Danh sách người dùng)

**THỐNG KÊ CARDS:**
- 👥 Tổng số người dùng
- ❤️ Tổng số yêu thích
- 🎫 Users có bookings

**BẢNG USERS:**
- Tên
- Email
- Ngày tham gia
- Số phim yêu thích

**SEARCH:**
- Tìm theo tên hoặc email
- Real-time filter

---

## 5. XỬ LÝ NGHIỆP VỤ PHỨC TẠP

### 5.1. Email System (Inngest Background Jobs)

**5 LOẠI EMAIL:**

#### 1. Booking Confirmation (Xác nhận đặt vé)
**TRIGGER:** Stripe webhook → Payment successful
**NỘI DUNG:**
- Tên phim, poster
- Ngày giờ chiếu
- Phòng chiếu (✨ đã fix)
- Ghế đã đặt
- Tổng tiền
- QR Code

**QR CODE DATA:**
```json
{
  "bookingId": "...",
  "userId": "...",
  "movieTitle": "...",
  "showTime": "...",
  "seats": ["A1", "A2"],
  "amount": 190000
}
```

#### 2. New Show Notification (Thông báo phim mới)
**TRIGGER:** Admin thêm phim MỚI lần đầu (isNewMovie = true)
**NỘI DUNG:**
- Poster phim
- Title, overview
- Genres, runtime, rating
- Button "ĐẶT VÉ NGAY" → Link đến movie details

**BATCH SENDING:** Gửi 50 users/batch để tránh rate limit
**FREQUENCY:** Chỉ 1 email/movie, không spam khi thêm nhiều suất

#### 3. Show Reminder (Nhắc nhở suất chiếu)
**TRIGGER:** Cron job chạy mỗi giờ
**ĐIỀU KIỆN:** Suất chiếu còn 3 giờ nữa
**NỘI DUNG:**
- Tên phim
- Ngày giờ chiếu
- "Phim sẽ bắt đầu trong khoảng 3 tiếng nữa"

**CRON:**
```javascript
{cron: "0 */1 * * *"} // Mỗi giờ vào phút 00
```

**QUERY:**
```javascript
const now = new Date();
const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

const shows = await Show.find({
    showTime: {$gte: now, $lt: in3Hours}
}).populate('movie');
```

#### 4. Payment Pending Check (Kiểm tra thanh toán)
**TRIGGER:** 10 phút sau khi tạo booking
**LOGIC:**
- Query Stripe API để check payment status
- Nếu **chưa thanh toán**:
  - Xóa booking khỏi DB
  - Xóa ghế khỏi `occupiedSeats`
  - Free ghế cho users khác
- Nếu **đã thanh toán**:
  - Không làm gì (đã xử lý bởi webhook)

#### 5. Daily Revenue Report (Báo cáo doanh thu)
**TRIGGER:** Cron job mỗi ngày 8:00 AM
**GỬI TỚI:** Admin email
**NỘI DUNG:**
- Tổng doanh thu hôm qua
- Số booking
- Top movies
- Chart

### 5.2. Concurrency & Race Conditions

**VẤN ĐỀ 1:** 2 users chọn cùng ghế đồng thời

**GIẢI PHÁP:**
```javascript
// Transaction-like check
const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
if(!isAvailable){
    return res.json({success: false, message: 'Ghế đã được đặt'});
}

// Immediately mark as occupied
selectedSeats.forEach(seat => {
    showData.occupiedSeats[seat] = userId;
});
await showData.save();
```

**VẤN ĐỀ 2:** Admin xóa show khi user đang booking

**GIẢI PHÁP:** Check show existence trước khi create booking

**VẤN ĐỀ 3:** Admin thêm 2 suất trùng nhau trong 1 request

**GIẢI PHÁP:** Internal conflict detection (đã giải thích ở mục 2.2.2)

### 5.3. Data Population Strategy

**LÝ DO:** MongoDB là NoSQL → Không có JOIN như SQL

**GIẢI PHÁP:** Mongoose `.populate()`

**VÍ DỤ:**
```javascript
// BAD: Không populate
const bookings = await Booking.find({});
// bookings[0].show = "670a3f..." (chỉ có ID)

// GOOD: Populate
const bookings = await Booking.find({})
  .populate('user')
  .populate({
    path: 'show',
    populate: [
      {path: 'movie', model: 'Movie'},
      {path: 'hall', model: 'CinemaHall'}
    ]
  });
// bookings[0].show.movie = { title: "Avengers", ... }
```

**KHI NÀO POPULATE:**
- Admin list pages (để hiển thị thông tin chi tiết)
- Email templates (cần full info)
- API responses trả về cho client

**KHI NÀO KHÔNG POPULATE:**
- Internal logic (chỉ cần ID)
- Performance-critical queries
- Đã có data trong client cache

---

## 6. CÂU TRẢ LỜI MẪU CHO GIẢNG VIÊN

### Q1: "Tại sao không cho phép bỏ trống 1 ghế?"

**TRẢ LỜI:**
> Em áp dụng quy tắc "No Single Seat Gap" - một best practice trong ngành đặt vé rạp phim. 
>
> **Lý do thực tế:** Nếu để trống 1 ghế, user tiếp theo sẽ không thể đặt vì:
> - Tối thiểu phải đặt 1 ghế (nhưng 1 ghế trống không có giá trị kinh doanh)
> - Hoặc đặt 2 ghế (vượt số ghế trống)
> - Hoặc ghế đôi (= 2 ghế, cũng vượt)
>
> **Kết quả:** Ghế đó bị "chết" → Lãng phí doanh thu
>
> **Ví dụ thực tế:** CGV, Galaxy đều áp dụng rule này. Khi chọn ghế, nếu vi phạm sẽ báo "Vui lòng không để trống 1 ghế"
>
> **Implementation:** Em validate 3 trường hợp: trống bên trái, trống bên phải, trống ở giữa.

---

### Q2: "Buffer time 20 phút có hợp lý không? Tại sao không 10 hoặc 30 phút?"

**TRẢ LỜI:**
> Em research từ các rạp thực tế:
> - **CGV:** Buffer ~15-20 phút (quảng cáo + trailer)
> - **Lotte Cinema:** ~20-25 phút
> - **Galaxy:** ~15-20 phút
>
> **20 phút bao gồm:**
> - 5-7 phút: Quảng cáo thương hiệu (Coca-Cola, Samsung...)
> - 8-10 phút: Trailer phim sắp chiếu
> - 3-5 phút: Intro/reminder (tắt điện thoại, không quay phim...)
>
> **Cleaning time 10 phút:**
> - Dọn rác, ghế
> - Check kỹ thuật (âm thanh, máy chiếu)
> - Chuẩn bị hall cho suất tiếp theo
>
> **Nếu giảm xuống 10 phút:** Staff không kịp dọn dẹp → Trải nghiệm kém
> **Nếu tăng lên 30 phút:** Lãng phí thời gian → Giảm số suất/ngày → Giảm doanh thu
>
> → 20+10 = 30 phút là **sweet spot** giữa trải nghiệm và hiệu quả.

---

### Q3: "Tại sao dùng Optimistic UI cho nút yêu thích? Rủi ro là gì?"

**TRẢ LỜI:**
> **Vấn đề ban đầu:** User click nhiều lần → Lag, nhiều toast notifications
>
> **Giải pháp 1 (Debounce):** Disable button trong khi API call
> - ❌ UX không tốt: User phải chờ
> - ❌ Không cho click liên tục
>
> **Giải pháp 2 (Optimistic UI):** ✅ Update UI ngay lập tức
> - ✅ UX mượt mà, instant feedback
> - ✅ Cho phép click liên tục
> - ⚠️ Rủi ro: Nếu API fail → Phải rollback
>
> **Implementation:**
> ```javascript
> // 1. Update UI trước
> setIsFavorited(!isFavorited);
> 
> // 2. Call API background
> axios.post('/api/favorite')
>   .then(() => toast.success())
>   .catch(() => {
>     // 3. Rollback nếu lỗi
>     setIsFavorited(originalState);
>     toast.error();
>   });
> ```
>
> **Rủi ro và xử lý:**
> - **Network fail:** Rollback + show error toast
> - **Server error:** Rollback + log error
> - **User offline:** Detect bằng `navigator.onLine`, show warning
>
> **Kết luận:** Optimistic UI là pattern chuẩn của các big tech (Facebook, Twitter, Instagram) vì UX > 99% reliability (vì API ít khi fail).

---

### Q4: "Conflict detection có thể fail không? Trường hợp nào?"

**TRẢ LỜI:**
> **2 loại conflict em handle:**
>
> **1. DB Conflict:** Trùng với show đã có
> - Query MongoDB với $or conditions
> - Check 3 trường hợp overlap
> - ✅ Reliable vì query trước khi insert
>
> **2. Internal Conflict:** Trùng giữa các show trong cùng request
> - Loop qua `showsToCreate` array
> - So sánh từng cặp (N^2 complexity)
> - ✅ Đảm bảo không có overlap trước khi insert
>
> **Trường hợp có thể fail:**
>
> **Scenario 1:** 2 admins thêm show đồng thời
> ```
> Time 0ms: Admin A query DB → No conflict
> Time 10ms: Admin B query DB → No conflict
> Time 20ms: Admin A insert show → Success
> Time 30ms: Admin B insert show → Success (❌ Conflict!)
> ```
>
> **Giải pháp để fix (nếu giảng viên hỏi):**
> - Option 1: Database transaction (MongoDB 4.0+)
> - Option 2: Optimistic locking với version field
> - Option 3: Distributed lock (Redis)
> - Option 4: Admin role limitation (chỉ 1 admin add show tại 1 thời điểm)
>
> **Tuy nhiên:** Trong scope dự án nhỏ, xác suất này <0.1% vì:
> - Thường chỉ có 1 admin online
> - Admin thường không add show đồng thời
> - Even nếu xảy ra, ảnh hưởng nhỏ (chỉ cần admin xóa 1 show)
>
> → **Trade-off** giữa complexity và probability. Em ưu tiên simplicity vì case này extremely rare.

---

### Q5: "Tại sao reset ghế khi chuyển suất chiếu? User có thể muốn giữ ghế cũ?"

**TRẢ LỜI:**
> **Lý do kỹ thuật:**
>
> **1. Hall khác nhau có layout khác:**
> - VIP Hall: 5 rows × 9 seats = 45 ghế
> - Standard Hall: 8 rows × 11 seats = 88 ghế
> - Nếu user chọn E1,E2 ở VIP Hall → Chuyển sang Standard → E1,E2 có thể đã bị đặt hoặc không tồn tại
>
> **2. Giá khác nhau:**
> - Suất 14:00 (không phụ thu): 50,000 VNĐ/ghế
> - Suất 18:00 (phụ thu tối): 60,000 VNĐ/ghế
> - Nếu giữ ghế → Tính giá sai → User hoặc rạp bị thiệt
>
> **3. Occupied seats khác:**
> - Suất 14:00: Ghế A1-A5 trống
> - Suất 18:00: Ghế A1-A5 đã đặt
> - Nếu giữ ghế → Conflict → Booking fail → UX tệ
>
> **4. UX clarity:**
> - User chuyển suất = thay đổi context hoàn toàn
> - Giữ ghế cũ → Confusing, user có thể không nhận ra đã chọn sai
> - Reset + thông báo → Clear intent, user biết phải chọn lại
>
> **Implementation:**
> ```javascript
> useEffect(() => {
>   setSelectedSeats([]); // Reset
>   toast.info('Đã chuyển suất chiếu. Vui lòng chọn lại ghế.');
> }, [selectedTime?.showId]);
> ```
>
> **So sánh thực tế:**
> - **CGV, Lotte, Galaxy:** Đều reset ghế khi chuyển suất
> - **Grab, Gojek:** Reset địa điểm khi đổi loại xe
> - **Airbnb:** Reset dates khi đổi property
>
> → Đây là **UX pattern** chuẩn trong ngành.

---

### Q6: "Tại sao không xóa movie khi admin muốn? Làm sao xử lý phim cũ?"

**TRẢ LỜI:**
> **Không xóa movie vì ảnh hưởng cascading:**
>
> **1. Bookings:**
> - User đã đặt vé cho movie này
> - Booking document reference `movie._id`
> - Nếu xóa → Booking.movie = null → Crash UI, mất lịch sử
>
> **2. Shows:**
> - Các suất chiếu (past & future) reference movie
> - Nếu xóa → Show.movie = null → Không hiển thị được
>
> **3. Favorites:**
> - Users đã thêm vào yêu thích
> - User.favoriteMovies = [movieId]
> - Nếu xóa → Populate fail → Error
>
> **4. Analytics & Reports:**
> - Báo cáo doanh thu theo phim
> - Top movies by bookings
> - Nếu xóa → Mất data lịch sử
>
> **Giải pháp thay thế (nếu giảng viên hỏi):**
>
> **Option 1: Soft Delete (Recommended)**
> ```javascript
> const movieSchema = new Schema({
>   // ... other fields
>   isDeleted: { type: Boolean, default: false },
>   deletedAt: Date
> });
> 
> // Query chỉ lấy movies chưa xóa
> Movie.find({ isDeleted: false });
> ```
>
> **Option 2: Archive**
> - Thêm field `isArchived`
> - Archived movies không hiện trong "Add Shows"
> - Nhưng vẫn hiện trong "List Movies" (read-only)
>
> **Option 3: Cascade Delete**
> - Xóa movie → Xóa tất cả shows → Xóa tất cả bookings
> - ❌ Quá nguy hiểm, mất data không khôi phục được
>
> **Quyết định:** Em không implement Delete vì:
> - Movies thường không cần xóa (chỉ cần ngừng chiếu)
> - Giữ data lịch sử rất quan trọng cho analytics
> - Soft delete có thể thêm sau nếu thực sự cần

---

### Q7: "Email reminder 3 giờ trước, user ở xa không kịp thì sao?"

**TRẢ LỜI:**
> **3 giờ là balanced choice:**
>
> **Quá sớm (8-24 giờ):**
> - ❌ User dễ quên
> - ❌ Kế hoạch có thể thay đổi
> - ❌ Email "spam", ít giá trị
>
> **Vừa phải (3-4 giờ):**
> - ✅ User còn nhớ đã đặt vé
> - ✅ Đủ thời gian chuẩn bị
> - ✅ Urgent nhưng không panic
>
> **Quá muộn (30-60 phút):**
> - ❌ Không đủ thời gian di chuyển
> - ❌ Nếu có việc đột xuất, không kịp hủy/đổi
>
> **Tham khảo thực tế:**
> | Dịch vụ | Reminder time |
> |---------|---------------|
> | CGV | 2-3 giờ trước |
> | Grab (ride) | 1-2 giờ trước |
> | Nhà hàng | 2-4 giờ trước |
> | Máy bay | 24h + 3h trước |
>
> **Xử lý user ở xa:**
> - User nên biết vị trí rạp khi đặt vé
> - Booking confirmation email có đủ thông tin
> - 3 giờ đủ để di chuyển trong thành phố (thậm chí peak hours)
> - Nếu user ở tỉnh khác → Đó là planning issue, không phải hệ thống
>
> **Tính năng mở rộng (future work):**
> - Cho user chọn reminder time (1h, 3h, 6h, 1 day)
> - Multiple reminders (24h + 3h)
> - Reminder có link Google Maps đến rạp
> - Estimate travel time dựa trên location

---

### Q8: "Tại sao dùng Inngest? Không dùng cron job đơn giản?"

**TRẢ LỜI:**
> **Comparison:**
>
> | Feature | Cron Job | Inngest |
> |---------|----------|---------|
> | **Setup** | Dễ (node-cron) | Phức tạp hơn |
> | **Retry** | Phải tự code | Built-in |
> | **Queue** | Không có | Có |
> | **Dashboard** | Không | Có (monitor, logs) |
> | **Scheduling** | Chỉ cron syntax | Cron + event-driven + delay |
> | **Scalability** | Server phải always-on | Serverless-ready |
>
> **Inngest advantages:**
>
> **1. Event-driven:**
> ```javascript
> // Trigger khi payment success
> await inngest.send({
>   name: "app/booking.paid",
>   data: { bookingId }
> });
> ```
> - Không cần polling
> - Instant trigger
> - Decoupled architecture
>
> **2. Built-in retry:**
> - Nếu email fail (network issue) → Auto retry 3 lần
> - Với cron: Phải tự implement retry logic
>
> **3. Dashboard & monitoring:**
> - Xem logs của mỗi job
> - Track success/failure rate
> - Debug dễ dàng
>
> **4. Complex flows:**
> ```javascript
> {
>   id: 'check-payment',
>   events: ['app/booking.created'],
>   async handler() {
>     // Chờ 10 phút
>     await step.sleep('10m');
>     
>     // Check payment
>     const status = await checkStripe();
>     if (!paid) {
>       await cancelBooking();
>     }
>   }
> }
> ```
> - `step.sleep` chính xác
> - Với cron: Phải lưu DB, query, check timestamp...
>
> **Nhược điểm Inngest:**
> - Thêm dependency
> - Learning curve
> - Free tier limit (nếu production cần paid plan)
>
> **Quyết định:** Em dùng Inngest vì:
> - Dự án có nhiều background jobs phức tạp
> - Cần reliability (retry, queue)
> - Practice với modern tools (marketable skill)
>
> **Nếu dự án nhỏ hơn:** Có thể dùng node-cron + Bull Queue

---

### Q9: "Stripe session expire 30 phút, sao không 10 hoặc 60 phút?"

**TRẢ LỜI:**
> **Lý do chọn 30 phút:**
>
> **1. Ngăn chặn "seat hoarding":**
> - User tạo nhiều bookings → Lock nhiều ghế → Không thanh toán
> - 30 phút đủ để quyết định, không quá dài để monopolize seats
>
> **2. Balance UX vs inventory:**
> - **Quá ngắn (5-10 phút):**
>   - ❌ User chưa kịp nhập thẻ
>   - ❌ Nếu có vấn đề (OTP, bank error) không đủ thời gian fix
>   - ❌ Stressful UX
> 
> - **Vừa phải (30 phút):**
>   - ✅ Đủ thời gian thanh toán bình thường
>   - ✅ Đủ thời gian handle issues
>   - ✅ Không quá dài → Seats available cho users khác
> 
> - **Quá dài (60+ phút):**
>   - ❌ Seats bị lock lâu
>   - ❌ User quên, không quay lại
>   - ❌ Giảm conversion rate
>
> **3. Industry standard:**
> - **Airline tickets:** 10-30 phút
> - **Concert tickets:** 15-20 phút
> - **E-commerce cart:** 30-60 phút
> - **CGV, Galaxy:** ~15-30 phút
>
> **4. Stripe recommendation:** 30 phút là default
>
> **Flow xử lý:**
> ```
> T+0: Create booking → Lock seats → Create Stripe session (30m)
> T+10: Inngest check payment
>   - If paid: ✅ Keep booking
>   - If not paid: Query Stripe API
>     - If session expired: ❌ Cancel booking, free seats
>     - If still pending: ⏳ Wait
> ```
>
> **Edge cases:**
> - User thanh toán phút thứ 29 → Stripe webhook trigger → Update booking → OK
> - User không thanh toán → Sau 30 phút session expire → Inngest cancel booking → Seats free
> - User click payment link sau 30 phút → Stripe reject → User phải book lại (acceptable UX)

---

### Q10: "Nếu em có thêm thời gian, em sẽ cải thiện gì?"

**TRẢ LỜI:**
> **1. Advanced Seat Selection:**
> - Heatmap hiển thị "best seats" (center, optimal view)
> - AI recommend seats dựa trên preferences
> - Preview view từ seat (360° photo)
>
> **2. Dynamic Pricing:**
> - Giá thay đổi theo demand (prime time +20%)
> - Early bird discount (đặt trước 1 tuần -10%)
> - Combo deals (2 vé + popcorn)
>
> **3. Membership System:**
> - Tích điểm khi đặt vé
> - VIP perks (priority booking, discount)
> - Tiered system (Silver/Gold/Platinum)
>
> **4. Enhanced Admin:**
> - Visual hall editor (drag-drop để design layout)
> - Bulk operations (add 30 shows for 1 movie in 1 click)
> - Advanced analytics (revenue forecast, occupancy rate)
>
> **5. Mobile App:**
> - React Native app
> - Push notifications (thay vì email)
> - Offline mode (xem booking history khi không có mạng)
>
> **6. Social Features:**
> - Invite friends (group booking)
> - Reviews & ratings
> - Share booking trên social media
>
> **7. Payment Options:**
> - MoMo, ZaloPay, VNPay (local Vietnamese payments)
> - Split payment (chia bill cho friends)
> - Voucher/promo codes
>
> **8. Accessibility:**
> - Wheelchair-accessible seats
> - Assistive listening devices
> - Closed captions info
>
> **9. Integration:**
> - Google Calendar sync (auto add event)
> - Apple Wallet / Google Pay (save ticket)
> - Uber/Grab integration (book ride đến rạp)
>
> **10. Performance:**
> - Redis caching (giảm DB queries)
> - CDN cho images/posters
> - Server-side rendering (Next.js) cho SEO
>
> **Ưu tiên nếu chỉ có 1 tháng thêm:**
> 1. Dynamic pricing (business value cao)
> 2. Mobile app (better UX)
> 3. Local payment gateways (Stripe chưa phổ biến ở VN)

---

## 7. TECHNICAL STACK JUSTIFICATION

Nếu giảng viên hỏi **"Tại sao chọn stack này?"**

### Frontend: React + Vite
**Lý do:**
- ✅ React: Most popular, large ecosystem, marketable skill
- ✅ Vite: Faster than CRA, better DX, modern tooling
- ✅ Tailwind CSS: Rapid prototyping, consistent design
- ✅ React Router: Standard routing solution

**Alternative considered:**
- Next.js: Overkill cho dự án này (không cần SSR)
- Vue/Angular: Ít phổ biến hơn, ít tài liệu

### Backend: Express + MongoDB
**Lý do:**
- ✅ Express: Minimalist, flexible, huge community
- ✅ MongoDB: Schema flexibility (movie data từ TMDB), easy populate
- ✅ Mongoose: Elegant ODM, validation, middleware

**Alternative considered:**
- NestJS: Quá heavyweight cho scope này
- PostgreSQL: Relationships phức tạp, MongoDB đơn giản hơn cho dự án này

### Authentication: Clerk
**Lý do:**
- ✅ OAuth out-of-the-box (Google, GitHub)
- ✅ No password management headache
- ✅ JWT built-in
- ✅ Easy integration

**Alternative considered:**
- NextAuth: Cần Next.js
- Passport: Phải tự implement nhiều
- Firebase Auth: Vendor lock-in

### Payment: Stripe
**Lý do:**
- ✅ Best developer experience
- ✅ Excellent documentation
- ✅ Test mode dễ dàng
- ✅ Webhook reliable

**Limitation:**
- ❌ Chưa phổ biến ở VN (cần thêm MoMo, ZaloPay cho production)

### Background Jobs: Inngest
**Lý do:**
- ✅ Event-driven architecture
- ✅ Built-in retry & monitoring
- ✅ Better than cron for complex flows

**Alternative considered:**
- Bull Queue: Cần Redis
- Agenda: Ít features hơn
- Cron: Không đủ cho requirements

---

## 8. COMMON PITFALLS TO AVOID

Những câu **KHÔNG NÊN NÓI** khi phản biện:

❌ "Em copy code từ tutorial"
❌ "Em không biết tại sao nó hoạt động"
❌ "Nếu có lỗi thì em sẽ fix sau"
❌ "Em không test edge cases"
❌ "Em làm theo thầy/bạn bảo"

Những câu **NÊN NÓI:**

✅ "Em research từ các rạp thực tế (CGV, Lotte)..."
✅ "Em áp dụng pattern X vì lý do Y..."
✅ "Em aware về vấn đề Z nhưng trade-off vì..."
✅ "Em test các trường hợp: A, B, C..."
✅ "Em tham khảo best practices từ..."

---

## 9. DEMO SCRIPT

**Chuẩn bị trước:**
1. Seed DB với data đẹp (movies, shows, bookings)
2. Chuẩn bị 2 tài khoản: User & Admin
3. Test tất cả flows 1 lần để đảm bảo không bug
4. Clear browser cache/cookies
5. Mở sẵn tabs (User view + Admin view)

**Demo flow (15-20 phút):**

### Part 1: User Journey (7 phút)
1. **Home page** (30s)
   - Giới thiệu: "Đây là trang chủ với các phim đang chiếu từ TMDB API"
   - Scroll: "Hiển thị 20 phim đầu tiên với poster, title, rating"

2. **Movie Details** (1 phút)
   - Click vào phim: "Chi tiết phim với overview, genres, runtime, cast"
   - Click ❤️: "Thêm vào yêu thích với Optimistic UI - instant feedback"
   - Click lại: "Bỏ yêu thích - không có lag"

3. **Booking Flow** (3 phút)
   - Click "Book Now"
   - Chọn ngày: "Chọn ngày trong tuần tới"
   - Chọn giờ: "Hiển thị các suất available, giá và hall"
   - Chọn ghế: 
     - "Hall layout với VIP rows"
     - "Ghế xám = đã đặt, không cho chọn"
     - "Chọn ghế A1, A2, A3"
     - Thử chọn A5: "Báo lỗi vì bỏ trống A4"
     - Bỏ A3, chọn A4: "OK, không vi phạm rule"
   - Click "Proceed to Payment"
   - Stripe: "Redirect đến Stripe Checkout, session expires 30 phút"
   - Thanh toán (test card: 4242...)
   - Success: "Redirect về My Bookings"

4. **My Bookings** (1 phút)
   - "Booking vừa tạo với QR code"
   - "Thông tin đầy đủ: phim, ghế, giá, thời gian"

5. **Favorites** (30s)
   - "List các phim đã thêm vào yêu thích"
   - Click vào phim: "Xem details hoặc đặt vé"

### Part 2: Admin Features (8 phút)

6. **Dashboard** (1 phút)
   - "Tổng quan: doanh thu, bookings, movies, users"
   - "Biểu đồ revenue 7 ngày gần nhất"
   - "Latest bookings"

7. **Add Shows** (3 phút)
   - "Search phim từ TMDB: Avengers"
   - Chọn hall: "VIP Hall 1"
   - Nhập giá: "60,000 VNĐ"
   - Chọn ngày: "Hôm nay + ngày mai"
   - Chọn giờ: "14:00, 18:00"
   - Hover poster: "Hiển thị runtime 180 phút, total 210 phút"
   - "Hiển thị end time: 14:00 → 17:30"
   - Submit
   - **Demo conflict:**
     - Thử thêm lại: 15:00 (trùng với 14:00-17:30)
     - "Báo lỗi conflict với message chi tiết"

8. **List Bookings** (2 phút)
   - "Tất cả bookings với filters"
   - Filter "Chưa thanh toán": "Hiển thị pending bookings"
   - Filter "Hôm nay": "Bookings hôm nay"
   - Search "Menong": "Tìm theo tên khách hàng"
   - Filter theo phim: "Chỉ hiển thị bookings của 1 phim"

9. **List Users** (1 phút)
   - "Danh sách users, ngày tham gia, số phim yêu thích"
   - Search

10. **List Shows** (1 phút)
    - "Tất cả shows, có thể xóa nếu chưa có booking"

---

## 10. FINAL CHECKLIST

Trước buổi phản biện, check:

### Code Quality
- [ ] Không có `console.log` debug statements
- [ ] Không có commented code
- [ ] Tất cả functions có tên rõ ràng
- [ ] Không có magic numbers (đã define constants)
- [ ] Error handling đầy đủ (try-catch)

### Functionality
- [ ] Tất cả features hoạt động
- [ ] Không có broken links/buttons
- [ ] Loading states hiển thị đúng
- [ ] Error messages clear & helpful
- [ ] Toast notifications không spam

### Database
- [ ] Seed đủ data (10+ movies, 20+ shows, 10+ bookings)
- [ ] Có cả bookings paid & unpaid
- [ ] Có shows future & past
- [ ] Users có favorites

### Environment
- [ ] `.env` files đầy đủ
- [ ] Stripe test keys (not production!)
- [ ] TMDB API key valid
- [ ] Inngest dev server running
- [ ] MongoDB connected

### Presentation
- [ ] Slides chuẩn bị (nếu cần)
- [ ] Demo account credentials ready
- [ ] Backup video (nếu internet fail)
- [ ] Code comments đầy đủ (especially ràng buộc phức tạp)

---

## PHỤ LỤC: KỸ THUẬT TRẢ LỜI CÂU HỎI KHÓ

### Nếu giảng viên hỏi điều bạn KHÔNG BIẾT:

**ĐỪNG NÓI:**
❌ "Em không biết ạ"
❌ "Em không nghĩ đến vấn đề đó"
❌ "Em không làm phần đó"

**NÊN NÓI:**
✅ "Đó là vấn đề hay! Em nghĩ có thể giải quyết bằng cách [guess logic]. Tuy nhiên em cần research thêm để implement chính xác."

✅ "Em chưa implement feature đó trong scope hiện tại vì [lý do]. Nhưng nếu mở rộng, em sẽ [approach]."

✅ "Câu hỏi thầy rất thực tế. Em aware về vấn đề này và nó nằm trong roadmap future work của em."

### Nếu giảng viên chỉ ra bug:

**ĐỪNG NÓI:**
❌ "Không thể có bug đâu ạ"
❌ "Em test rồi mà"
❌ "Bug này nhỏ thôi ạ"

**NÊN NÓI:**
✅ "Cảm ơn thầy đã chỉ ra! Em sẽ note lại và fix ngay. Có thể do [phân tích nguyên nhân]."

✅ "Đúng ạ, đó là edge case em chưa handle. Em sẽ thêm validation [giải pháp]."

### Nếu giảng viên hỏi về performance:

"Em optimize như thế nào cho 1000 concurrent users?"

**TRẢ LỜI:**
> Hiện tại dự án em optimize cho ~100 concurrent users với:
> - Mongoose indexes (showDateTime, hall, user)
> - React useMemo để tránh re-render
> - Lazy loading cho images
>
> Nếu scale lên 1000 users, em sẽ:
> 1. Redis caching cho frequently accessed data
> 2. Database read replicas
> 3. CDN cho static assets
> 4. Load balancer cho multiple server instances
> 5. Connection pooling cho DB
>
> Nhưng em nghĩ cho scope dự án học tập, optimization hiện tại là đủ. Production scaling là challenge khác cần team DevOps.

---

**CHÚC BẠN PHẢN BIỆN THÀNH CÔNG! 🎓🎉**

**Tips cuối:**
- Tự tin, nói rõ ràng, không quá nhanh
- Nhìn vào mắt giảng viên khi trả lời
- Nếu nervous, breathe deeply trước khi nói
- Cười tự nhiên, đây là project bạn tự hào!
- Remember: Bạn là người hiểu code nhất trong phòng!

