# Hướng Dẫn Deploy Dự Án LVTN

## 📋 Tổng Quan

Dự án này bao gồm:
- **Frontend (Client)**: React + Vite - Deploy trên Vercel
- **Backend (Server)**: Express.js - Deploy trên Vercel hoặc Railway/Render

## 🚀 Deploy Frontend (Client) lên Vercel

### Cách 1: Deploy qua Vercel CLI

1. **Cài đặt Vercel CLI** (nếu chưa có):
```bash
npm i -g vercel
```

2. **Đăng nhập Vercel**:
```bash
vercel login
```

3. **Deploy client**:
```bash
cd client
vercel
```

4. **Thêm Environment Variables**:
   - Vào Vercel Dashboard → Project Settings → Environment Variables
   - Thêm: `VITE_CLERK_PUBLISHABLE_KEY`
   - Thêm: `VITE_API_URL` (URL của backend sau khi deploy)

### Cách 2: Deploy qua GitHub

1. **Push code lên GitHub**
2. **Vào [Vercel Dashboard](https://vercel.com/dashboard)**
3. **Import Project** từ GitHub
4. **Cấu hình**:
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Thêm Environment Variables** như trên

## 🔧 Deploy Backend (Server) lên Vercel

### Cách 1: Deploy riêng biệt

1. **Deploy server**:
```bash
cd server
vercel
```

2. **Thêm Environment Variables** trong Vercel Dashboard:
   - `MONGODB_URI`
   - `CLERK_SECRET_KEY`
   - `INNGEST_EVENT_KEY` (nếu dùng)
   - `INNGEST_SIGNING_KEY` (nếu dùng)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (nếu dùng)

### Cách 2: Deploy qua GitHub

1. **Tạo project mới trên Vercel**
2. **Import từ GitHub**
3. **Cấu hình**:
   - Root Directory: `server`
   - Build Command: (để trống hoặc `npm install`)
   - Output Directory: (để trống)
4. **Thêm Environment Variables**

## 🚂 Deploy Backend lên Railway (Alternative)

1. **Đăng ký tại [Railway.app](https://railway.app)**
2. **Tạo New Project** → Deploy from GitHub
3. **Chọn repository và folder `server`**
4. **Thêm Environment Variables**:
   - `MONGODB_URI`
   - `CLERK_SECRET_KEY`
   - Các biến khác cần thiết
5. **Railway sẽ tự động deploy**

## 📝 Environment Variables Cần Thiết

### Frontend (.env trong client/)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://your-server.vercel.app
```

### Backend (.env trong server/)
```
MONGODB_URI=mongodb+srv://...
PORT=3000
CLERK_SECRET_KEY=sk_test_...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## ✅ Checklist Trước Khi Deploy

- [ ] Đã tạo file `.env` với tất cả biến môi trường
- [ ] Đã test local với `npm run dev` (client) và `npm start` (server)
- [ ] Đã build thành công: `npm run build` (client)
- [ ] Đã cấu hình MongoDB Atlas (nếu dùng cloud)
- [ ] Đã setup Clerk và lấy keys
- [ ] Đã cấu hình Inngest (nếu dùng)
- [ ] Đã cấu hình Cloudinary (nếu dùng)

## 🔗 Sau Khi Deploy

1. **Lấy URL của backend** (ví dụ: `https://your-server.vercel.app`)
2. **Cập nhật `VITE_API_URL` trong frontend** với URL backend
3. **Redeploy frontend** để áp dụng thay đổi
4. **Test các chức năng**:
   - Authentication
   - API calls
   - Database connections

## 🐛 Troubleshooting

### Lỗi MongoDB Connection
- Kiểm tra `MONGODB_URI` đúng format
- Kiểm tra IP whitelist trong MongoDB Atlas
- Kiểm tra network access trong MongoDB Atlas

### Lỗi Clerk Authentication
- Kiểm tra keys đúng environment (test/production)
- Kiểm tra callback URLs trong Clerk Dashboard

### Lỗi Build
- Kiểm tra Node.js version (nên dùng 18+)
- Xóa `node_modules` và `package-lock.json`, chạy lại `npm install`

## 📚 Tài Liệu Tham Khảo

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Clerk Documentation](https://clerk.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

