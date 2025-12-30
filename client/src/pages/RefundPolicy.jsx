import React from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-36 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Chính sách hoàn vé
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Thông tin về điều kiện và quy trình hoàn vé tại QuickShow
        </p>
      </div>

      {/* Refund Table */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-gray-800/50 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-700">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock size={28} />
              Tỷ lệ hoàn tiền theo thời gian
            </h2>
          </div>
          
          <div className="divide-y divide-gray-700">
            {/* >= 24h */}
            <div className="p-6 hover:bg-gray-700/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-green-500/10 p-3 rounded-full border border-green-500/30">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Hủy trước ≥ 24 giờ
                  </h3>
                  <p className="text-gray-400 mb-2">
                    Được hoàn <span className="text-green-400 font-bold">80%</span> giá trị vé
                  </p>
                  <p className="text-sm text-gray-500">
                    Thời gian lý tưởng để hủy vé với mức hoàn cao nhất
                  </p>
                </div>
              </div>
            </div>

            {/* 12-24h */}
            <div className="p-6 hover:bg-gray-700/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-yellow-500/10 p-3 rounded-full border border-yellow-500/30">
                  <AlertCircle className="text-yellow-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Hủy trước 12-24 giờ
                  </h3>
                  <p className="text-gray-400 mb-2">
                    Được hoàn <span className="text-yellow-400 font-bold">50%</span> giá trị vé
                  </p>
                  <p className="text-sm text-gray-500">
                    Hủy trong khung giờ này sẽ chịu phí hủy 50%
                  </p>
                </div>
              </div>
            </div>

            {/* 6-12h */}
            <div className="p-6 hover:bg-gray-700/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-orange-500/10 p-3 rounded-full border border-orange-500/30">
                  <AlertCircle className="text-orange-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Hủy trước 6-12 giờ
                  </h3>
                  <p className="text-gray-400 mb-2">
                    Được hoàn <span className="text-orange-400 font-bold">20%</span> giá trị vé
                  </p>
                  <p className="text-sm text-gray-500">
                    Gần đến giờ chiếu, phí hủy cao hơn
                  </p>
                </div>
              </div>
            </div>

            {/* < 6h */}
            <div className="p-6 hover:bg-gray-700/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-red-500/10 p-3 rounded-full border border-red-500/30">
                  <XCircle className="text-red-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Hủy dưới 6 giờ
                  </h3>
                  <p className="text-gray-400 mb-2">
                    <span className="text-red-400 font-bold">Không được hoàn tiền</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Quá gần giờ chiếu, không thể hủy vé
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-blue-500/10 rounded-xl p-8 border border-blue-500/30">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Info size={24} className="text-blue-400" />
            Lưu ý quan trọng
          </h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Thời gian tính từ lúc bạn yêu cầu hủy vé đến giờ bắt đầu suất chiếu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Số tiền hoàn sẽ được chuyển về tài khoản gốc trong vòng 5-7 ngày làm việc</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Vé đã hủy không thể được hoàn tác hoặc sử dụng lại</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Bạn sẽ nhận được email xác nhận khi hủy vé thành công</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Đối với vé chưa thanh toán, việc hủy sẽ không phát sinh giao dịch hoàn tiền</span>
            </li>
          </ul>
        </div>
      </div>

      {/* How to Cancel */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-6">Cách hủy vé</h3>
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="bg-red-600/20 text-red-400 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                1
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">Truy cập trang "Vé của tôi"</p>
                <p className="text-gray-400 text-sm">Đăng nhập và vào mục quản lý vé đã đặt</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-red-600/20 text-red-400 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                2
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">Chọn vé cần hủy</p>
                <p className="text-gray-400 text-sm">Tìm vé bạn muốn hủy trong danh sách</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-red-600/20 text-red-400 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                3
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">Nhấn nút "Hủy vé"</p>
                <p className="text-gray-400 text-sm">Hệ thống sẽ tự động tính toán số tiền hoàn</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-red-600/20 text-red-400 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                4
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">Xác nhận hủy</p>
                <p className="text-gray-400 text-sm">Kiểm tra thông tin và xác nhận hủy vé</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-red-600/20 text-red-400 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                5
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">Nhận email xác nhận</p>
                <p className="text-gray-400 text-sm">Email sẽ chứa chi tiết về số tiền được hoàn</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Contact Support */}
      <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl p-10 border border-red-500/30">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Cần hỗ trợ thêm?
        </h2>
        <p className="text-gray-300 mb-6">
          Nếu bạn gặp vấn đề khi hủy vé hoặc có thắc mắc về chính sách hoàn tiền, vui lòng liên hệ với chúng tôi
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a 
            href="mailto:quickshow@gmail.com" 
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Email hỗ trợ
          </a>
          <a 
            href="tel:0933331843" 
            className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Gọi hotline
          </a>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;

