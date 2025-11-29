# Các Hướng Xác Định Admin Khi Không Có Trường Role

## Vấn Đề
User model không có trường `role`, nhưng cần phân biệt Admin và User để bảo vệ routes `/admin/*`.

---

## 📋 **5 HƯỚNG GIẢI QUYẾT**

### 🎯 **HƯỚNG 1: Sử dụng Clerk Public Metadata (KHUYẾN NGHỊ) ⭐**

**Ưu điểm:**
- ✅ Không cần thay đổi database schema
- ✅ Role lưu trực tiếp trong Clerk
- ✅ Dễ quản lý từ Clerk Dashboard
- ✅ Đồng bộ tự động với Clerk

**Cách triển khai:**
- Lưu role trong Clerk User Public Metadata
- Check role từ Clerk user object trong frontend/backend

**Code example:**
```javascript
// Backend - Middleware check admin
import { getAuth } from '@clerk/express';

const isAdmin = async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  // Get user from Clerk
  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata?.role;
  
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

**Frontend - Check admin:**
```javascript
import { useUser } from '@clerk/clerk-react';

const { user } = useUser();
const isAdmin = user?.publicMetadata?.role === 'admin';
```

---

### 🎯 **HƯỚNG 2: Whitelist Email/User ID (Đơn giản nhất)**

**Ưu điểm:**
- ✅ Đơn giản, nhanh
- ✅ Không cần thay đổi gì trong database
- ✅ Dễ implement

**Nhược điểm:**
- ❌ Phải cập nhật code khi có admin mới
- ❌ Khó scale với nhiều admin

**Cách triển khai:**
- Lưu danh sách admin emails/IDs trong biến môi trường
- Check email/ID của user đăng nhập

**Code example:**
```javascript
// server/.env
ADMIN_EMAILS=admin1@example.com,admin2@example.com
// hoặc
ADMIN_USER_IDS=user_123,user_456

// Middleware
const isAdmin = async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const user = await clerkClient.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;
  
  if (!adminEmails.includes(userEmail)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

---

### 🎯 **HƯỚNG 3: Thêm Role vào User Model (Truyền thống)**

**Ưu điểm:**
- ✅ Lưu trực tiếp trong database
- ✅ Dễ query, filter theo role
- ✅ Có thể có nhiều role trong tương lai

**Nhược điểm:**
- ❌ Phải thay đổi schema
- ❌ Phải sync với Clerk khi user mới tạo

**Cách triển khai:**
```javascript
// server/models/User.js
const userSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
```

**Update Inngest để sync role:**
- Khi user tạo mới → default role = 'user'
- Admin set role thủ công hoặc từ Clerk metadata

---

### 🎯 **HƯỚNG 4: Clerk Organizations với Roles**

**Ưu điểm:**
- ✅ Phù hợp nếu có nhiều admin/team
- ✅ Clerk hỗ trợ sẵn organizations
- ✅ Có thể có nhiều role (admin, manager, etc.)

**Nhược điểm:**
- ❌ Phức tạp hơn nếu chỉ cần 2 role đơn giản
- ❌ Phải setup Organizations trong Clerk

**Cách triển khai:**
- Tạo Organization "Admins" trong Clerk
- Check user có trong organization "Admins" không
- Hoặc check role trong organization

---

### 🎯 **HƯỚNG 5: Tạo Collection Admin riêng**

**Ưu điểm:**
- ✅ Tách biệt hoàn toàn Admin và User
- ✅ Dễ quản lý danh sách admin

**Nhược điểm:**
- ❌ Phải maintain 2 collections
- ❌ Code phức tạp hơn

**Cách triển khai:**
```javascript
// server/models/Admin.js
const adminSchema = new mongoose.Schema({
    _id: {type: String, required: true}, // Clerk User ID
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
```

---

## 🔧 **SO SÁNH CÁC HƯỚNG**

| Hướng | Độ khó | Tính linh hoạt | Phù hợp khi |
|-------|--------|----------------|-------------|
| **1. Clerk Metadata** | ⭐⭐ | ⭐⭐⭐⭐⭐ | Khuyến nghị cho mọi trường hợp |
| **2. Whitelist Email/ID** | ⭐ | ⭐⭐ | Ít admin, đơn giản |
| **3. Thêm Role vào User** | ⭐⭐⭐ | ⭐⭐⭐⭐ | Muốn query role trong DB |
| **4. Organizations** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Nhiều admin, team structure |
| **5. Collection Admin** | ⭐⭐⭐ | ⭐⭐⭐ | Cần tách biệt hoàn toàn |

---

## 🎯 **KHUYẾN NGHỊ**

### **Nên dùng HƯỚNG 1 (Clerk Public Metadata)** vì:

1. ✅ **Không cần thay đổi database** - User model giữ nguyên
2. ✅ **Quản lý dễ dàng** - Set role từ Clerk Dashboard
3. ✅ **Đồng bộ tự động** - Clerk handle sync
4. ✅ **Bảo mật tốt** - Role được Clerk quản lý
5. ✅ **Linh hoạt** - Dễ thêm role mới sau này

### **Nếu cần đơn giản nhanh:**
→ Dùng **HƯỚNG 2 (Whitelist Email)** - chỉ cần thêm vài dòng code

---

## 💻 **IMPLEMENTATION GUIDE - Hướng 1 (Clerk Metadata)**

### Bước 1: Set role trong Clerk Dashboard
1. Vào Clerk Dashboard → Users
2. Chọn user cần làm admin
3. Vào tab "Metadata"
4. Thêm Public Metadata: `{ "role": "admin" }`

### Bước 2: Backend Middleware

```javascript
// server/middleware/auth.js
import { getAuth, clerkClient } from '@clerk/express';

export const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Please login' });
    }
    
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);
    const role = user.publicMetadata?.role || 'user';
    
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Bước 3: Protect Backend Routes

```javascript
// server/routes/showRoutes.js
import express from 'express';
import { addShow, getNowPlayingMovies } from '../controllers/showController.js';
import { requireAdmin } from '../middleware/auth.js';

const showRouter = express.Router();
showRouter.get('/now-playing', getNowPlayingMovies);
showRouter.post('/add', requireAdmin, addShow); // Protected route

export default showRouter;
```

### Bước 4: Frontend Protected Route

```javascript
// client/src/components/ProtectedAdminRoute.jsx
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  const isAdmin = user.publicMetadata?.role === 'admin';
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};
```

### Bước 5: Wrap Admin Routes

```javascript
// client/src/App.jsx
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

<Route path='/admin/*' element={
  <ProtectedAdminRoute>
    <Layout />
  </ProtectedAdminRoute>
}>
  <Route index element={<Dashboard />} />
  <Route path="add-shows" element={<AddShows />} />
  <Route path="list-shows" element={<ListShows />} />
  <Route path="list-bookings" element={<ListBookings />} />
</Route>
```

---

## 📝 **TÓM TẮT**

**Câu trả lời:** Dù User model không có trường `role`, bạn vẫn có **5 cách** để phân biệt Admin:

1. ✅ **Clerk Public Metadata** (Khuyến nghị) - Lưu role trong Clerk
2. ✅ **Whitelist Email/ID** - Đơn giản nhất, lưu trong .env
3. ✅ **Thêm role vào User Model** - Lưu trong database
4. ✅ **Clerk Organizations** - Phù hợp nhiều admin
5. ✅ **Collection Admin riêng** - Tách biệt hoàn toàn

**Khuyến nghị:** Dùng **Clerk Public Metadata** vì không cần thay đổi database và dễ quản lý!

