# 🚀 Hướng Dẫn Deploy Nhanh

## Bước 1: Chuẩn bị Environment Variables

### Frontend (Client)
Tạo file `.env` trong thư mục `client/`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=https://your-server-url.vercel.app
```

### Backend (Server)
Tạo file `.env` trong thư mục `server/`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
PORT=3000
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Bước 2: Cài đặt Vercel CLI

```bash
npm i -g vercel
```

## Bước 3: Deploy

### Windows (PowerShell):
```powershell
.\deploy.ps1
```

### Linux/Mac:
```bash
bash deploy.sh
```

### Hoặc deploy thủ công:

**Deploy Frontend:**
```bash
cd client
vercel --prod
```

**Deploy Backend:**
```bash
cd server
vercel --prod
```

## Bước 4: Thêm Environment Variables trên Vercel

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Settings → Environment Variables
4. Thêm tất cả các biến từ file `.env`

## Bước 5: Cập nhật Frontend với Backend URL

1. Lấy URL backend từ Vercel (ví dụ: `https://your-server.vercel.app`)
2. Cập nhật `VITE_API_URL` trong Vercel Dashboard cho frontend
3. Redeploy frontend

## ✅ Xong!

Xem file `DEPLOYMENT.md` để biết thêm chi tiết.

