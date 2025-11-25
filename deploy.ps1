# PowerShell script để deploy dự án LVTN
# Sử dụng: .\deploy.ps1

Write-Host "🚀 Bắt đầu deploy dự án LVTN..." -ForegroundColor Green

# Kiểm tra Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI chưa được cài đặt" -ForegroundColor Red
    Write-Host "📦 Đang cài đặt Vercel CLI..." -ForegroundColor Yellow
    npm i -g vercel
}

# Deploy Frontend
Write-Host ""
Write-Host "📦 Đang deploy Frontend (Client)..." -ForegroundColor Cyan
Set-Location client
vercel --prod
Set-Location ..

# Deploy Backend
Write-Host ""
Write-Host "🔧 Đang deploy Backend (Server)..." -ForegroundColor Cyan
Set-Location server
vercel --prod
Set-Location ..

Write-Host ""
Write-Host "✅ Deploy hoàn tất!" -ForegroundColor Green
Write-Host "📝 Đừng quên thêm Environment Variables trong Vercel Dashboard" -ForegroundColor Yellow
Write-Host "📖 Xem file DEPLOYMENT.md để biết thêm chi tiết" -ForegroundColor Yellow

