# Sơ đồ Use Case - Website đặt vé xem phim

## Sơ đồ Use Case đầy đủ (Mermaid)

```mermaid
graph LR
    subgraph System["Website đặt vé xem phim"]
        direction TB
        
        %% Use Cases chính - User
        UC1(Quản lý tài khoản)
        UC2(Xem danh sách phim)
        UC3(Xem chi tiết phim)
        UC4(Đặt vé xem phim)
        UC5(Thanh toán)
        UC6(Quản lý đặt chỗ)
        UC7(Quản lý phim yêu thích)
        
        %% Use Cases mở rộng - Quản lý tài khoản
        UC13(Đăng ký)
        UC14(Đăng nhập)
        UC15(Đăng xuất)
        
        %% Use Cases mở rộng - Đặt vé
        UC16(Chọn suất chiếu)
        UC17(Chọn ghế ngồi)
        UC18(Xác nhận đặt chỗ)
        
        %% Use Cases mở rộng - Quản lý đặt chỗ
        UC19(Xem lịch sử đặt vé)
        UC20(Hủy đặt chỗ)
        
        %% Use Cases Admin
        UC8(Quản lý chương trình)
        UC9(Quản lý đặt chỗ)
        UC10(Quản lý người dùng)
        UC11(Quản lý phòng chiếu)
        UC12(Xem báo cáo thống kê)
        
        %% Use Cases mở rộng - Quản lý chương trình
        UC21(Thêm chương trình)
        UC22(Xem danh sách chương trình)
        UC23(Hủy chương trình)
        
        %% Relationships - Extend
        UC1 -.->|<<extend>>| UC13
        UC1 -.->|<<extend>>| UC14
        UC1 -.->|<<extend>>| UC15
        
        UC6 -.->|<<extend>>| UC19
        UC6 -.->|<<extend>>| UC20
        
        UC8 -.->|<<extend>>| UC21
        UC8 -.->|<<extend>>| UC22
        UC8 -.->|<<extend>>| UC23
        
        %% Relationships - Include
        UC4 -.->|<<include>>| UC16
        UC4 -.->|<<include>>| UC17
        UC4 -.->|<<include>>| UC18
        
        %% Relationships - General
        UC2 --> UC3
        UC3 --> UC4
        UC4 --> UC5
    end
    
    %% Actors
    User((Người dùng))
    Admin((Quản trị viên))
    
    %% User connections
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    
    %% Admin connections
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    
    style System fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    style User fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style Admin fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
```

## Sơ đồ Use Case đơn giản hóa (giống hình mẫu)

```mermaid
graph LR
    subgraph System["Website đặt vé xem phim"]
        direction TB
        
        UC1(Quản lý tài khoản)
        UC2(Xem danh sách phim)
        UC3(Xem chi tiết phim)
        UC4(Đặt vé xem phim)
        UC5(Thanh toán)
        UC6(Quản lý đặt chỗ)
        UC7(Quản lý phim yêu thích)
        UC8(Quản lý chương trình)
        UC9(Quản lý đặt chỗ Admin)
        UC10(Quản lý người dùng)
        UC11(Quản lý phòng chiếu)
        UC12(Xem báo cáo thống kê)
        
        UC13(Đăng ký)
        UC14(Đăng nhập)
        UC15(Đăng xuất)
        
        UC1 -.->|<<extend>>| UC13
        UC1 -.->|<<extend>>| UC14
        UC1 -.->|<<extend>>| UC15
    end
    
    User((Người dùng))
    Admin((Quản trị viên))
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    
    style System fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    style User fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style Admin fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
```

## Mô tả các Use Case:

### Người dùng (User):
1. **Quản lý tài khoản** - Quản lý thông tin tài khoản
   - Đăng ký
   - Đăng nhập
   - Đăng xuất
2. **Xem danh sách phim** - Xem danh sách phim đang chiếu và sắp chiếu
3. **Xem chi tiết phim** - Xem thông tin chi tiết, trailer, lịch chiếu
4. **Đặt vé xem phim** - Đặt vé cho suất chiếu
   - Chọn suất chiếu
   - Chọn ghế ngồi
   - Xác nhận đặt chỗ
5. **Thanh toán** - Thanh toán vé đã đặt
6. **Quản lý đặt chỗ** - Quản lý các đặt chỗ của mình
   - Xem lịch sử đặt vé
   - Hủy đặt chỗ
7. **Quản lý phim yêu thích** - Thêm/xóa phim yêu thích

### Quản trị viên (Admin):
8. **Quản lý chương trình** - Quản lý các suất chiếu
   - Thêm chương trình
   - Xem danh sách chương trình
   - Hủy chương trình
9. **Quản lý đặt chỗ** - Xem và quản lý tất cả đặt chỗ
10. **Quản lý người dùng** - Xem danh sách người dùng
11. **Quản lý phòng chiếu** - Quản lý các phòng chiếu
12. **Xem báo cáo thống kê** - Xem dashboard với thống kê doanh thu, đặt chỗ

