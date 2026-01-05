# 🔧 HƯỚNG DẪN XỬ LÝ LỖI

## Lỗi: "Cannot read properties of null (reading 'priceMultiplier')"

### 🔍 Nguyên nhân
Lỗi này xảy ra khi database có các **suất chiếu (shows)** tham chiếu đến các **phòng chiếu (cinema halls)** đã bị xóa hoặc không tồn tại.

### ✅ Giải pháp

#### **Bước 1: Dọn dẹp database**
Chạy script cleanup để xóa các shows không hợp lệ:

```bash
cd server
node seed/cleanupInvalidShows.js
```

Script này sẽ:
- ✅ Tìm tất cả shows có hall reference = null
- ✅ Hiển thị danh sách shows sẽ bị xóa
- ✅ Xóa các shows không hợp lệ khỏi database

#### **Bước 2: Khởi động lại server**
```bash
cd server
npm start
```

#### **Bước 3: Kiểm tra ứng dụng**
- Truy cập trang chi tiết phim
- Nếu vẫn thấy lỗi, reload lại trang (Ctrl + R hoặc F5)

---

## Các lỗi khác trong Console

### 1. ⚠️ "Unchecked runtime.lastError: Could not establish connection"
**Nguyên nhân:** Lỗi từ Chrome Extension, không ảnh hưởng đến ứng dụng.

**Giải pháp:** Có thể bỏ qua an toàn. Nếu muốn tắt:
- Vào `chrome://extensions/`
- Tắt các extension không cần thiết

---

### 2. ⚠️ "Clerk has been loaded with development keys"
**Nguyên nhân:** Đang sử dụng Clerk development keys (bình thường khi dev).

**Giải pháp:** 
- ✅ Trong môi trường development: Bỏ qua, ứng dụng vẫn hoạt động bình thường
- ⚠️ Khi deploy production: Đổi sang production keys tại [Clerk Dashboard](https://dashboard.clerk.com)

---

### 3. ⚠️ "Failed to execute 'postMessage' on 'DOMWindow': YouTube origin mismatch"
**Nguyên nhân:** YouTube iframe API security warning khi chạy trên localhost.

**Giải pháp:** Có thể bỏ qua, trailer vẫn hoạt động bình thường. Lỗi này sẽ tự mất khi deploy lên production.

---

## 🚨 Cách phòng tránh lỗi trong tương lai

### 1. **Không xóa Cinema Halls đang được sử dụng**
Trước khi xóa một cinema hall, hãy:
- Kiểm tra xem còn shows nào đang sử dụng hall đó không
- Xóa hoặc chuyển các shows sang hall khác trước

### 2. **Sử dụng Soft Delete**
Thay vì xóa hẳn, đánh dấu hall là "inactive" hoặc "maintenance":

```javascript
// Thay vì
await CinemaHall.findByIdAndDelete(hallId);

// Nên dùng
await CinemaHall.findByIdAndUpdate(hallId, { 
  status: 'maintenance' 
});
```

### 3. **Thêm Data Validation**
Backend đã được cập nhật để:
- ✅ Filter ra các shows có hall null
- ✅ Trả về thông báo rõ ràng khi không có shows hợp lệ
- ✅ Không crash khi gặp data không hợp lệ

---

## 📞 Vẫn gặp vấn đề?

1. **Kiểm tra server đang chạy:**
   ```bash
   # Trong terminal server
   npm start
   ```

2. **Kiểm tra client đang chạy:**
   ```bash
   # Trong terminal client
   npm run dev
   ```

3. **Kiểm tra file .env.local:**
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   VITE_BASE_URL=http://localhost:4000
   VITE_TMDB_API_KEY=...
   VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
   ```

4. **Clear cache và reload:**
   - Ctrl + Shift + Delete (Chrome)
   - Chọn "Cached images and files"
   - Reload lại trang (Ctrl + R)

5. **Kiểm tra MongoDB đang chạy:**
   ```bash
   # Nếu dùng MongoDB local
   mongosh
   
   # Hoặc kiểm tra connection string trong .env
   ```

---

## 🛠️ Debug Tips

### Xem logs chi tiết:
```javascript
// Trong MovieDetails.jsx
console.log('Show data:', show);
console.log('Error:', error);
```

### Kiểm tra network requests:
1. Mở Chrome DevTools (F12)
2. Tab "Network"
3. Filter "Fetch/XHR"
4. Click vào request `/api/show/:id`
5. Xem Response

### Kiểm tra database:
```bash
mongosh
use your_database_name
db.shows.find({ hall: null }).count()
```

---

**Cập nhật lần cuối:** 29/12/2024










