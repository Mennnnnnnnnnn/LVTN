import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-36 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FileText className="text-red-500" size={40} />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Điều khoản sử dụng
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ QuickShow
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
            <CheckCircle className="text-red-500" size={24} />
            1. Chấp nhận điều khoản
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              Bằng việc truy cập và sử dụng dịch vụ đặt vé xem phim của QuickShow, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện sau đây.
            </p>
            <p>
              Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            2. Tài khoản người dùng
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white">2.1. Đăng ký tài khoản:</strong> Để sử dụng dịch vụ đặt vé, bạn cần tạo tài khoản với thông tin chính xác và đầy đủ.
            </p>
            <p>
              <strong className="text-white">2.2. Bảo mật tài khoản:</strong> Bạn có trách nhiệm bảo vệ thông tin đăng nhập và chịu trách nhiệm cho mọi hoạt động diễn ra dưới tài khoản của mình.
            </p>
            <p>
              <strong className="text-white">2.3. Thông tin chính xác:</strong> Bạn cam kết cung cấp thông tin đúng sự thật, chính xác và cập nhật thông tin khi có thay đổi.
            </p>
            <p>
              <strong className="text-white">2.4. Độ tuổi:</strong> Bạn phải đủ 13 tuổi trở lên để tạo tài khoản. Người dưới 18 tuổi cần có sự giám sát của phụ huynh.
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            3. Dịch vụ đặt vé
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white">3.1. Đặt vé:</strong> Vé được đặt qua hệ thống trực tuyến và chỉ có giá trị cho suất chiếu đã chọn.
            </p>
            <p>
              <strong className="text-white">3.2. Thanh toán:</strong> Bạn phải thanh toán đầy đủ trước khi vé được xác nhận. Chúng tôi chấp nhận các phương thức thanh toán qua Stripe.
            </p>
            <p>
              <strong className="text-white">3.3. Giá vé:</strong> Giá vé có thể thay đổi tùy theo suất chiếu, loại ghế và chương trình khuyến mãi. Giá cuối cùng sẽ được hiển thị trước khi thanh toán.
            </p>
            <p>
              <strong className="text-white">3.4. Xác nhận:</strong> Sau khi thanh toán thành công, bạn sẽ nhận email xác nhận với mã QR để check-in tại rạp.
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            4. Hủy vé và hoàn tiền
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white">4.1. Chính sách hủy:</strong> Vé có thể được hủy tối thiểu 6 giờ trước suất chiếu theo chính sách hoàn vé.
            </p>
            <p>
              <strong className="text-white">4.2. Tỷ lệ hoàn tiền:</strong> Số tiền hoàn lại phụ thuộc vào thời gian hủy (80%, 50%, hoặc 20% giá vé).
            </p>
            <p>
              <strong className="text-white">4.3. Thời gian xử lý:</strong> Tiền sẽ được hoàn lại vào tài khoản gốc trong vòng 3 ngày làm việc.
            </p>
            <p>
              <strong className="text-white">4.4. Không hoàn tiền:</strong> Vé không được hoàn tiền trong trường hợp hủy dưới 6 giờ hoặc đã check-in.
            </p>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            5. Quyền và nghĩa vụ người dùng
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white">5.1. Sử dụng hợp pháp:</strong> Bạn cam kết sử dụng dịch vụ cho mục đích hợp pháp và không vi phạm quyền của người khác.
            </p>
            <p>
              <strong className="text-white">5.2. Cấm:</strong> Nghiêm cấm hành vi gian lận, giả mạo, spam, hoặc bất kỳ hành vi nào gây ảnh hưởng đến hệ thống.
            </p>
            <p>
              <strong className="text-white">5.3. Vé cá nhân:</strong> Vé mua chỉ dùng cho mục đích cá nhân, không được bán lại hoặc sử dụng cho mục đích thương mại.
            </p>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            6. Giới hạn trách nhiệm
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong className="text-white">6.1. Dịch vụ "như là":</strong> Dịch vụ được cung cấp "như là" không có bảo đảm rõ ràng hoặc ngụ ý nào.
            </p>
            <p>
              <strong className="text-white">6.2. Trách nhiệm rạp:</strong> QuickShow chỉ cung cấp nền tảng đặt vé. Chất lượng dịch vụ tại rạp do rạp chiếu đối tác chịu trách nhiệm.
            </p>
            <p>
              <strong className="text-white">6.3. Hủy suất chiếu:</strong> Trong trường hợp suất chiếu bị hủy do rạp, chúng tôi sẽ hoàn tiền 100% trong vòng 3 ngày.
            </p>
            <p>
              <strong className="text-white">6.4. Bất khả kháng:</strong> Chúng tôi không chịu trách nhiệm cho các trường hợp bất khả kháng như thiên tai, chiến tranh, sự cố kỹ thuật.
            </p>
          </div>
        </div>

        {/* Section 7 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            7. Quyền sở hữu trí tuệ
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              Tất cả nội dung trên website bao gồm văn bản, hình ảnh, logo, giao diện thuộc quyền sở hữu của QuickShow hoặc được cấp phép sử dụng hợp pháp.
            </p>
            <p>
              Bạn không được sao chép, phân phối, hoặc sử dụng bất kỳ nội dung nào mà không có sự cho phép bằng văn bản từ chúng tôi.
            </p>
          </div>
        </div>

        {/* Section 8 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            8. Thay đổi điều khoản
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              QuickShow có quyền thay đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng trên website.
            </p>
            <p>
              Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
            </p>
          </div>
        </div>

        {/* Section 9 */}
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-red-500" size={24} />
            9. Liên hệ
          </h2>
          <div className="text-gray-300 space-y-3 leading-relaxed">
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên hệ với chúng tôi:
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
      <div className="max-w-4xl mx-auto mt-16 text-center bg-blue-500/10 rounded-xl p-8 border border-blue-500/30">
        <p className="text-gray-400 text-sm leading-relaxed">
          Bằng việc sử dụng dịch vụ QuickShow, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý với các điều khoản sử dụng này. 
          Chúng tôi khuyến khích bạn xem lại các điều khoản định kỳ để cập nhật các thay đổi.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;

