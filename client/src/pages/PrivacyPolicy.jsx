import React from 'react';
import { Shield, Lock, Eye, UserCheck, Database, Bell } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-36 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="text-red-500" size={40} />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Chính sách bảo mật
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          QuickShow cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Cập nhật lần cuối: Tháng 12, 2024
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Section 1 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="text-blue-500" size={24} />
            1. Thông tin chúng tôi thu thập
          </h2>
          <div className="text-gray-300 space-y-4 leading-relaxed">
            <div>
              <h3 className="font-semibold text-white mb-2">1.1. Thông tin bạn cung cấp:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Họ tên, email, số điện thoại khi đăng ký tài khoản</li>
                <li>Thông tin thanh toán (được xử lý an toàn qua Stripe)</li>
                <li>Lịch sử đặt vé và giao dịch</li>
                <li>Thông tin liên hệ khi bạn gửi yêu cầu hỗ trợ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">1.2. Thông tin tự động thu thập:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Địa chỉ IP, loại trình duyệt, thiết bị</li>
                <li>Dữ liệu cookies và công nghệ tracking tương tự</li>
                <li>Thời gian truy cập, trang đã xem</li>
                <li>Nguồn truy cập website (referral)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="text-purple-500" size={24} />
            2. Cách chúng tôi sử dụng thông tin
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>Chúng tôi sử dụng thông tin của bạn để:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-white">Cung cấp dịch vụ:</strong> Xử lý đặt vé, thanh toán, gửi email xác nhận</li>
              <li><strong className="text-white">Cải thiện trải nghiệm:</strong> Cá nhân hóa nội dung, đề xuất phim phù hợp</li>
              <li><strong className="text-white">Hỗ trợ khách hàng:</strong> Giải đáp thắc mắc, xử lý khiếu nại</li>
              <li><strong className="text-white">Bảo mật:</strong> Phát hiện và ngăn chặn gian lận, lạm dụng</li>
              <li><strong className="text-white">Marketing:</strong> Gửi thông báo về phim mới, ưu đãi (với sự đồng ý của bạn)</li>
              <li><strong className="text-white">Phân tích:</strong> Hiểu cách người dùng tương tác với dịch vụ</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck className="text-green-500" size={24} />
            3. Chia sẻ thông tin
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>Chúng tôi có thể chia sẻ thông tin của bạn với:</p>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-white mb-1">3.1. Đối tác rạp chiếu:</p>
                <p className="text-sm">Thông tin cần thiết để xử lý vé và check-in tại rạp.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">3.2. Nhà cung cấp dịch vụ:</p>
                <p className="text-sm">Stripe (thanh toán), Clerk (xác thực), Inngest (email), các dịch vụ cloud hosting.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">3.3. Yêu cầu pháp lý:</p>
                <p className="text-sm">Khi có yêu cầu từ cơ quan có thẩm quyền theo quy định pháp luật.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">3.4. Không bán thông tin:</p>
                <p className="text-sm text-green-400">Chúng tôi KHÔNG bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="text-yellow-500" size={24} />
            4. Bảo mật thông tin
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ thông tin của bạn:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-white">Mã hóa SSL/TLS:</strong> Tất cả dữ liệu truyền tải được mã hóa</li>
              <li><strong className="text-white">Xác thực an toàn:</strong> Sử dụng Clerk với các tiêu chuẩn bảo mật cao</li>
              <li><strong className="text-white">Không lưu thông tin thẻ:</strong> Thông tin thanh toán được xử lý trực tiếp qua Stripe</li>
              <li><strong className="text-white">Giới hạn truy cập:</strong> Chỉ nhân viên cần thiết mới có quyền truy cập dữ liệu</li>
              <li><strong className="text-white">Giám sát:</strong> Hệ thống được giám sát 24/7 để phát hiện bất thường</li>
            </ul>
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-400">
                <strong>⚠️ Lưu ý:</strong> Không có hệ thống nào là an toàn tuyệt đối 100%. Chúng tôi khuyến khích bạn sử dụng mật khẩu mạnh và không chia sẻ thông tin đăng nhập.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="text-orange-500" size={24} />
            5. Cookies và Tracking
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white">5.1. Cookies là gì?</strong> Cookies là các file nhỏ được lưu trên thiết bị của bạn để ghi nhớ thông tin.
            </p>
            <p>
              <strong className="text-white">5.2. Chúng tôi sử dụng cookies để:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Duy trì phiên đăng nhập</li>
              <li>Ghi nhớ preferences của bạn</li>
              <li>Phân tích traffic và hành vi người dùng</li>
              <li>Cải thiện hiệu suất website</li>
            </ul>
            <p>
              <strong className="text-white">5.3. Quản lý cookies:</strong> Bạn có thể tắt cookies trong cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến trải nghiệm sử dụng.
            </p>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck className="text-cyan-500" size={24} />
            6. Quyền của bạn
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>Bạn có các quyền sau đối với thông tin cá nhân của mình:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-white">Quyền truy cập:</strong> Xem thông tin cá nhân chúng tôi đang lưu giữ</li>
              <li><strong className="text-white">Quyền chỉnh sửa:</strong> Cập nhật thông tin không chính xác</li>
              <li><strong className="text-white">Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu (một số dữ liệu có thể được giữ lại theo quy định pháp luật)</li>
              <li><strong className="text-white">Quyền hạn chế:</strong> Yêu cầu giới hạn xử lý dữ liệu trong một số trường hợp</li>
              <li><strong className="text-white">Quyền phản đối:</strong> Phản đối việc xử lý dữ liệu cho mục đích marketing</li>
              <li><strong className="text-white">Quyền rút lại đồng ý:</strong> Hủy đăng ký nhận email marketing bất cứ lúc nào</li>
            </ul>
            <p className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 text-sm">
              Để thực hiện các quyền trên, vui lòng liên hệ: <a href="mailto:quickshow@gmail.com" className="text-cyan-400 hover:underline">quickshow@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Section 7 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="text-red-500" size={24} />
            7. Lưu trữ và xóa dữ liệu
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white">7.1. Thời gian lưu trữ:</strong> Chúng tôi lưu trữ thông tin của bạn miễn là tài khoản còn hoạt động hoặc cần thiết để cung cấp dịch vụ.
            </p>
            <p>
              <strong className="text-white">7.2. Lưu trữ pháp lý:</strong> Một số dữ liệu (như lịch sử giao dịch) có thể được lưu lâu hơn theo yêu cầu pháp luật về kế toán và thuế.
            </p>
            <p>
              <strong className="text-white">7.3. Xóa tài khoản:</strong> Khi bạn xóa tài khoản, thông tin cá nhân sẽ được xóa trong vòng 30 ngày (trừ dữ liệu cần giữ theo pháp luật).
            </p>
          </div>
        </div>

        {/* Section 8 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="text-pink-500" size={24} />
            8. Quyền riêng tư của trẻ em
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              Dịch vụ của chúng tôi không nhắm đến trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em dưới 13 tuổi.
            </p>
            <p>
              Nếu bạn là phụ huynh và phát hiện con bạn đã cung cấp thông tin cho chúng tôi, vui lòng liên hệ để chúng tôi xóa thông tin đó.
            </p>
          </div>
        </div>

        {/* Section 9 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="text-indigo-500" size={24} />
            9. Thay đổi chính sách
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được thông báo trên trang này với ngày "Cập nhật lần cuối".
            </p>
            <p>
              Đối với các thay đổi quan trọng, chúng tôi sẽ gửi email thông báo đến địa chỉ email bạn đã đăng ký.
            </p>
          </div>
        </div>

        {/* Section 10 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck className="text-teal-500" size={24} />
            10. Liên hệ về quyền riêng tư
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này hoặc cách chúng tôi xử lý dữ liệu của bạn, vui lòng liên hệ:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Email: <a href="mailto:quickshow@gmail.com" className="text-red-500 hover:underline">quickshow@gmail.com</a></li>
              <li>Điện thoại: <a href="tel:0933331843" className="text-red-500 hover:underline">0933 331 843</a></li>
              <li>Địa chỉ: Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. HCM</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-4xl mx-auto mt-16 text-center bg-green-500/10 rounded-xl p-8 border border-green-500/30">
        <Lock className="mx-auto mb-4 text-green-400" size={32} />
        <p className="text-gray-400 text-sm leading-relaxed">
          QuickShow cam kết bảo vệ quyền riêng tư của bạn và tuân thủ các quy định về bảo vệ dữ liệu cá nhân. 
          Chúng tôi sử dụng các công nghệ và quy trình bảo mật tiên tiến để đảm bảo thông tin của bạn luôn được an toàn.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

