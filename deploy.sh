#!/bin/bash

# Script để deploy dự án LVTN
# Sử dụng: bash deploy.sh

echo "🚀 Bắt đầu deploy dự án LVTN..."

# Kiểm tra Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI chưa được cài đặt"
    echo "📦 Đang cài đặt Vercel CLI..."
    npm i -g vercel
fi

# Deploy Frontend
echo ""
echo "📦 Đang deploy Frontend (Client)..."
cd client
vercel --prod
cd ..

# Deploy Backend
echo ""
echo "🔧 Đang deploy Backend (Server)..."
cd server
vercel --prod
cd ..

echo ""
echo "✅ Deploy hoàn tất!"
echo "📝 Đừng quên thêm Environment Variables trong Vercel Dashboard"
echo "📖 Xem file DEPLOYMENT.md để biết thêm chi tiết"

