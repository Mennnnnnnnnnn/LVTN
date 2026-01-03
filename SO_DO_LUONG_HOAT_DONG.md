# 📊 SƠ ĐỒ MINH HỌA LUỒNG HOẠT ĐỘNG HỆ THỐNG

## 🎯 TỔNG QUAN

Tài liệu này chứa các sơ đồ minh họa luồng hoạt động của hệ thống đặt vé xem phim, được vẽ bằng Mermaid diagram syntax.

---

## 1. 📐 SƠ ĐỒ KIẾN TRÚC TỔNG QUAN HỆ THỐNG

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        A[User Browser] --> B[React App]
        B --> C[Pages & Components]
        C --> D[API Calls via Axios]
    end
    
    subgraph "Backend (Node.js + Express)"
        D --> E[API Routes]
        E --> F[Controllers]
        F --> G[Models/MongoDB]
        F --> H[External Services]
    end
    
    subgraph "Database"
        G --> I[(MongoDB Atlas)]
        I --> J[User Collection]
        I --> K[Movie Collection]
        I --> L[Show Collection]
        I --> M[Booking Collection]
        I --> N[CinemaHall Collection]
    end
    
    subgraph "External Services"
        H --> O[Clerk Auth]
        H --> P[Stripe Payment]
        H --> Q[TMDB API]
        H --> R[Brevo Email]
        H --> S[Inngest Jobs]
    end
    
    subgraph "Background Jobs"
        S --> T[Sync User]
        S --> U[Auto Cancel Booking]
        S --> V[Send Emails]
    end
    
    style A fill:#e1f5ff
    style I fill:#fff4e1
    style O fill:#ffe1f5
    style P fill:#e1ffe1
    style Q fill:#f5e1ff
    style R fill:#ffe1e1
    style S fill:#e1e1ff
```

---

## 2. 🔄 SƠ ĐỒ LUỒNG ĐẶT VÉ VÀ THANH TOÁN

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant DB as MongoDB
    participant S as Stripe
    participant I as Inngest
    participant E as Email Service

    U->>F: 1. Truy cập trang phim
    F->>B: GET /api/show/all
    B->>DB: Query shows sắp tới
    DB-->>B: Danh sách phim
    B-->>F: Trả về danh sách phim
    F-->>U: Hiển thị danh sách

    U->>F: 2. Click vào phim
    F->>B: GET /api/show/:movieId
    B->>DB: Query movie + shows
    B->>DB: Query TMDB (nếu cần)
    DB-->>B: Thông tin phim + lịch chiếu
    B-->>F: Movie details + schedule
    F-->>U: Hiển thị chi tiết phim

    U->>F: 3. Chọn suất chiếu → "Mua vé"
    F->>B: GET /api/booking/seats/:showId
    B->>DB: Query Show.occupiedSeats
    DB-->>B: Danh sách ghế đã đặt
    B-->>F: Occupied seats
    F-->>U: Hiển thị sơ đồ ghế

    U->>F: 4. Chọn ghế (validation frontend)
    F->>F: Validate: max 5 ghế, không trống 1 ghế
    F->>F: Tính giá: base × multiplier + phụ thu
    F-->>U: Hiển thị tổng tiền

    U->>F: 5. Click "Thanh toán"
    F->>B: POST /api/booking/create
    B->>DB: Kiểm tra ghế còn trống
    B->>DB: Tạo Booking (ispaid: false)
    B->>DB: Chiếm giữ ghế (occupiedSeats)
    B->>S: Tạo Stripe Checkout Session
    S-->>B: Payment URL
    B->>I: Trigger event "app/checkpayment"
    B-->>F: Payment URL
    F-->>U: Redirect đến Stripe

    U->>S: 6. Thanh toán trên Stripe
    S->>S: Xử lý payment
    S->>B: Webhook "payment_intent.succeeded"
    B->>DB: Update Booking (ispaid: true)
    B->>I: Trigger event "app/show.booked"
    S-->>U: Redirect về success URL

    I->>I: Function: send-booking-confirmation-email
    I->>DB: Query booking details
    I->>I: Tạo QR code
    I->>E: Gửi email xác nhận + QR code
    E-->>U: Email xác nhận đặt vé

    Note over I: Sau 10 phút
    I->>I: Function: release-seats-delete-booking
    I->>DB: Kiểm tra ispaid
    alt Chưa thanh toán
        I->>DB: Giải phóng ghế
        I->>DB: Xóa booking
    else Đã thanh toán
        I->>I: Không làm gì
    end
```

---

## 3. 👨‍💼 SƠ ĐỒ LUỒNG ADMIN THÊM SUẤT CHIẾU

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend API
    participant DB as MongoDB
    participant T as TMDB API
    participant I as Inngest
    participant E as Email Service

    A->>F: 1. Truy cập "Thêm suất chiếu"
    F->>B: GET /api/show/now-playing
    B->>T: Fetch phim đang chiếu
    T-->>B: Danh sách phim
    B-->>F: Movies với runtime
    F-->>A: Hiển thị danh sách phim

    A->>F: 2. Chọn phim + Nhập thông tin
    Note over A: - Chọn phòng chiếu<br/>- Nhập giá vé<br/>- Chọn ngày-giờ chiếu

    A->>F: 3. Click "Thêm suất chiếu"
    F->>B: POST /api/show/add
    B->>DB: Kiểm tra Movie có trong DB?
    
    alt Movie chưa có trong DB
        B->>T: Fetch movie details
        B->>T: Fetch credits
        B->>T: Fetch videos
        T-->>B: Movie data
        B->>DB: Tạo Movie record
    end

    B->>B: Conflict Detection
    Note over B: Với mỗi date-time:<br/>- Tính endDateTime<br/>- Kiểm tra xung đột với shows trong DB<br/>- Kiểm tra xung đột trong request<br/>- Kiểm tra ngày >= ngày khởi chiếu

    alt Có xung đột
        B-->>F: Lỗi + danh sách conflicts
        F-->>A: Hiển thị lỗi
    else Không xung đột
        B->>DB: Tạo các Show records
        DB-->>B: Shows đã tạo
        
        alt Phim mới (lần đầu)
            B->>I: Trigger event "app/show.added"
            I->>I: Function: send-new-show-notifications
            I->>DB: Lấy tất cả users
            I->>E: Gửi email thông báo (batch 50)
            E-->>A: Email thông báo phim mới
        end
        
        B-->>F: Success message
        F-->>A: Thông báo thành công
    end
```

---

## 4. 🔄 SƠ ĐỒ LUỒNG HỦY VÉ

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant DB as MongoDB
    participant I as Inngest
    participant E as Email Service

    U->>F: 1. Vào "Vé đặt của tôi"
    F->>B: GET /api/user/bookings
    B->>DB: Query bookings của user
    DB-->>B: Danh sách bookings
    B-->>F: Bookings (paid/unpaid)
    F-->>U: Hiển thị danh sách vé

    U->>F: 2. Click "Hủy vé"
    F->>B: POST /api/booking/cancel/:bookingId
    B->>DB: Tìm booking
    B->>B: Kiểm tra quyền sở hữu
    B->>B: Kiểm tra trạng thái
    B->>B: Kiểm tra thời gian (showDateTime > now)

    alt Vé chưa thanh toán
        B->>DB: Giải phóng ghế
        B->>DB: Xóa booking
        B-->>F: Success (không gửi email)
        F-->>U: Thông báo hủy thành công
    else Vé đã thanh toán
        B->>B: Tính hoàn tiền
        Note over B: - Trước 24h: 80%<br/>- Trước 12-24h: 50%<br/>- Trước 6-12h: 20%<br/>- Dưới 6h: 0% (không cho hủy)
        
        alt Không được hủy (< 6h)
            B-->>F: Lỗi "Không thể hủy"
            F-->>U: Thông báo lỗi
        else Được hủy
            B->>DB: Update booking (status: cancelled, refundAmount)
            B->>DB: Giải phóng ghế
            B->>I: Trigger event "app/booking.cancelled"
            B-->>F: Success + refund info
            
            I->>I: Function: send-cancellation-email
            I->>DB: Query booking details
            I->>E: Gửi email xác nhận hủy + hoàn tiền
            E-->>U: Email xác nhận hủy vé
            
            F-->>U: Thông báo hủy thành công + số tiền hoàn
        end
    end
```

---

## 5. 🔄 SƠ ĐỒ LUỒNG BACKGROUND JOBS

```mermaid
graph TB
    subgraph "User Sync (Clerk Webhooks)"
        A[Clerk User Created] --> B[Inngest: sync-user-from-clerk]
        B --> C[Create User in MongoDB]
        
        D[Clerk User Updated] --> E[Inngest: update-user-from-clerk]
        E --> F[Update User in MongoDB]
        
        G[Clerk User Deleted] --> H[Inngest: delete-user-with-clerk]
        H --> I[Delete User from MongoDB]
    end
    
    subgraph "Auto Cancel Booking"
        J[Booking Created] --> K[Trigger: app/checkpayment]
        K --> L[Inngest: release-seats-delete-booking]
        L --> M{Wait 10 minutes}
        M --> N{Check ispaid?}
        N -->|false| O[Release Seats]
        O --> P[Delete Booking]
        N -->|true| Q[Do Nothing]
    end
    
    subgraph "Email Notifications"
        R[Payment Success] --> S[Trigger: app/show.booked]
        S --> T[Inngest: send-booking-confirmation-email]
        T --> U[Generate QR Code]
        U --> V[Send Email with QR]
        
        W[Cron: Every 1 hour] --> X[Inngest: send-show-reminders]
        X --> Y[Find Shows in 3 hours]
        Y --> Z[Send Reminder Emails]
        
        AA[New Movie Added] --> AB[Trigger: app/show.added]
        AB --> AC[Inngest: send-new-show-notifications]
        AC --> AD[Get All Users]
        AD --> AE[Send Batch Emails 50/batch]
        
        AF[Booking Cancelled] --> AG[Trigger: app/booking.cancelled]
        AG --> AH[Inngest: send-cancellation-email]
        AH --> AI[Send Cancellation Email]
    end
    
    style A fill:#ffe1f5
    style D fill:#ffe1f5
    style G fill:#ffe1f5
    style J fill:#e1ffe1
    style R fill:#e1ffe1
    style W fill:#e1e1ff
    style AA fill:#e1e1ff
    style AF fill:#ffe1e1
```

---

## 6. 🏗️ SƠ ĐỒ KIẾN TRÚC DỮ LIỆU (Database Schema)

```mermaid
erDiagram
    USER ||--o{ BOOKING : "has"
    MOVIE ||--o{ SHOW : "has"
    SHOW ||--o{ BOOKING : "has"
    CINEMAHALL ||--o{ SHOW : "has"
    
    USER {
        string _id "Clerk User ID"
        string name
        string email "unique"
        string image
        array favoriteMovies
    }
    
    MOVIE {
        string _id "TMDB ID"
        string title
        string overview
        string poster_path
        string backdrop_path
        array genres
        array casts
        number vote_average
        number runtime
        string trailer_key
    }
    
    SHOW {
        objectid _id
        string movie "ref Movie"
        string hall "ref CinemaHall"
        datetime showDateTime
        datetime endDateTime
        number showPrice
        object occupiedSeats "seat: userId"
    }
    
    BOOKING {
        objectid _id
        string user "ref User"
        string show "ref Show"
        number amount
        array bookedSeats
        boolean ispaid "default false"
        string paymentLink
        string status "active/cancelled"
        number refundPercentage
        number refundAmount
    }
    
    CINEMAHALL {
        objectid _id
        string name
        number hallNumber "unique"
        string type "Standard/VIP/IMAX"
        number totalSeats
        object seatLayout
        object customRowSeats
        number priceMultiplier
        string status "active/maintenance/inactive"
        array brokenSeats
    }
```

---

## 7. 🔐 SƠ ĐỒ XÁC THỰC VÀ PHÂN QUYỀN

```mermaid
graph TB
    subgraph "User Authentication"
        A[User Request] --> B{Has Token?}
        B -->|No| C[Redirect to Login]
        B -->|Yes| D[Verify JWT Token]
        D --> E{Valid?}
        E -->|No| C
        E -->|Yes| F[Extract User Info]
    end
    
    subgraph "Admin Authorization"
        F --> G{Is Admin Route?}
        G -->|No| H[Allow Access]
        G -->|Yes| I{Check Role}
        I -->|role !== admin| J[403 Forbidden]
        I -->|role === admin| H
    end
    
    subgraph "API Protection"
        K[API Request] --> L[Middleware: protectAdmin]
        L --> M[Get User from Clerk]
        M --> N{privateMetadata.role === 'admin'?}
        N -->|No| O[403 Forbidden]
        N -->|Yes| P[Allow Access]
    end
    
    style C fill:#ffe1e1
    style J fill:#ffe1e1
    style O fill:#ffe1e1
    style H fill:#e1ffe1
    style P fill:#e1ffe1
```

---

## 8. 💰 SƠ ĐỒ TÍNH GIÁ VÉ

```mermaid
graph TB
    A[User Chọn Ghế] --> B[Lấy Show Data]
    B --> C[Lấy Hall Data]
    C --> D[Tính Base Price]
    D --> E[Base Price = showPrice × priceMultiplier]
    
    E --> F{Với mỗi ghế}
    F --> G{Is Couple Seat?}
    G -->|Yes| H[+10.000₫]
    G -->|No| I[Giữ nguyên]
    
    H --> J{Is Evening Show?}
    I --> J
    J -->|>= 17h| K[+10.000₫]
    J -->|No| L[Giữ nguyên]
    
    K --> M[Tính Seat Price]
    L --> M
    M --> N[Tổng Amount]
    N --> O[Total = Sum of all seat prices]
    
    style D fill:#e1f5ff
    style E fill:#fff4e1
    style H fill:#ffe1f5
    style K fill:#ffe1f5
    style O fill:#e1ffe1
```

---

## 9. ⚠️ SƠ ĐỒ CONFLICT DETECTION

```mermaid
graph TB
    A[Admin Thêm Show] --> B[Với mỗi date-time]
    B --> C[Tính endDateTime]
    C --> D[endDateTime = showDateTime + runtime + 10 + 20 phút]
    
    D --> E[Kiểm tra xung đột với DB]
    E --> F{Show mới bắt đầu<br/>khi show cũ đang chiếu?}
    F -->|Yes| G[CONFLICT]
    F -->|No| H{Show mới kết thúc<br/>khi show cũ đang chiếu?}
    
    H -->|Yes| G
    H -->|No| I{Show mới bọc<br/>hoàn toàn show cũ?}
    I -->|Yes| G
    I -->|No| J[Kiểm tra xung đột trong request]
    
    J --> K{Có xung đột<br/>trong cùng request?}
    K -->|Yes| G
    K -->|No| L[Kiểm tra ngày >= ngày khởi chiếu]
    
    L --> M{Ngày show >=<br/>ngày khởi chiếu?}
    M -->|No| G
    M -->|Yes| N[VALID - Tạo Show]
    
    G --> O[Trả về lỗi + danh sách conflicts]
    N --> P[Tạo Show record]
    
    style G fill:#ffe1e1
    style N fill:#e1ffe1
    style P fill:#e1ffe1
```

---

## 10. 📧 SƠ ĐỒ HỆ THỐNG EMAIL

```mermaid
graph LR
    subgraph "Email Types"
        A[Booking Confirmation] --> B[QR Code + Booking Details]
        C[Show Reminder] --> D[Remind 3 hours before]
        E[New Movie Notification] --> F[Announce new movie]
        G[Cancellation Confirmation] --> H[Refund Info]
    end
    
    subgraph "Email Flow"
        I[Event Trigger] --> J[Inngest Function]
        J --> K[Query Data from DB]
        K --> L[Format Email Template]
        L --> M[Generate QR Code if needed]
        M --> N[Call Brevo API]
        N --> O[Email Sent]
    end
    
    subgraph "Email Service"
        N --> P[Brevo HTTP API]
        P --> Q[SMTP Server]
        Q --> R[User Email]
    end
    
    style A fill:#e1ffe1
    style C fill:#e1e1ff
    style E fill:#ffe1f5
    style G fill:#ffe1e1
    style O fill:#e1ffe1
```

---

## 📊 **HƯỚNG DẪN XEM SƠ ĐỒ**

### Cách xem sơ đồ:
1. **Trong GitHub/GitLab**: Sơ đồ Mermaid sẽ tự động render
2. **Trong VS Code**: Cài extension "Markdown Preview Mermaid Support"
3. **Online**: Copy code vào [Mermaid Live Editor](https://mermaid.live/)

### Ký hiệu trong sơ đồ:
- **Hình chữ nhật**: Process/Function
- **Hình thoi**: Decision/Condition
- **Hình tròn**: Start/End
- **Mũi tên**: Flow direction
- **Màu sắc**: Phân loại module

---

*Tài liệu này chứa các sơ đồ minh họa đầy đủ luồng hoạt động của hệ thống đặt vé xem phim.*

