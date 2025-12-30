import React from 'react';
import { Film, Calendar, Armchair, CreditCard, Mail, CheckCircle } from 'lucide-react';

const BookingGuide = () => {
  const steps = [
    {
      icon: Film,
      title: "Bước 1: Chọn phim",
      description: "Duyệt qua danh sách phim đang chiếu hoặc sắp chiếu trên trang chủ. Click vào phim bạn quan tâm để xem chi tiết.",
      tips: [
        "Xem trailer và đánh giá trước khi chọn",
        "Kiểm tra thể loại và thời lượng phim",
        "Đọc mô tả để biết nội dung phim"
      ],
      color: "red"
    },
    {
      icon: Calendar,
      title: "Bước 2: Chọn ngày và suất chiếu",
      description: "Chọn ngày bạn muốn xem phim, sau đó chọn khung giờ phù hợp. Mỗi suất chiếu sẽ hiển thị thời gian bắt đầu và giá vé.",
      tips: [
        "Suất tối (sau 17h) có giá cao hơn",
        "Kiểm tra thời gian để sắp xếp lịch trình",
        "Đến sớm 15 phút trước giờ chiếu"
      ],
      color: "blue"
    },
    {
      icon: Armchair,
      title: "Bước 3: Chọn ghế ngồi",
      description: "Xem sơ đồ phòng chiếu và chọn ghế bạn muốn. Ghế màu xanh là ghế trống, ghế màu xám là ghế đã được đặt.",
      tips: [
        "Ghế đôi (couple seat) có phụ thu thêm",
        "Ghế giữa màn hình thường được ưa chuộng",
        "Có thể chọn nhiều ghế cùng lúc"
      ],
      color: "purple"
    },
    {
      icon: CreditCard,
      title: "Bước 4: Thanh toán",
      description: "Xác nhận thông tin đặt vé và tiến hành thanh toán qua Stripe. Hệ thống hỗ trợ thẻ Visa, Mastercard, American Express.",
      tips: [
        "Ghế giữ trong 30 phút, thanh toán nhanh",
        "Kiểm tra kỹ thông tin trước khi thanh toán",
        "Giao dịch được bảo mật an toàn"
      ],
      color: "green"
    },
    {
      icon: Mail,
      title: "Bước 5: Nhận vé qua email",
      description: "Sau khi thanh toán thành công, bạn sẽ nhận email xác nhận kèm mã QR. Email chứa đầy đủ thông tin vé và hướng dẫn.",
      tips: [
        "Kiểm tra cả thư mục Spam/Junk",
        "Lưu lại email hoặc tải mã QR về máy",
        "Có thể xem lại vé trong mục 'Vé của tôi'"
      ],
      color: "yellow"
    },
    {
      icon: CheckCircle,
      title: "Bước 6: Đến rạp và check-in",
      description: "Đến rạp trước 15 phút, xuất trình mã QR tại quầy để check-in. Nhân viên sẽ quét mã và hướng dẫn bạn vào phòng chiếu.",
      tips: [
        "Mang theo điện thoại hoặc in mã QR",
        "Đến đúng giờ để không bỏ lỡ phần đầu",
        "Mã QR chỉ dùng được một lần"
      ],
      color: "teal"
    }
  ];

  const colorClasses = {
    red: "from-red-600/20 to-red-800/20 border-red-500/30",
    blue: "from-blue-600/20 to-blue-800/20 border-blue-500/30",
    purple: "from-purple-600/20 to-purple-800/20 border-purple-500/30",
    green: "from-green-600/20 to-green-800/20 border-green-500/30",
    yellow: "from-yellow-600/20 to-yellow-800/20 border-yellow-500/30",
    teal: "from-teal-600/20 to-teal-800/20 border-teal-500/30"
  };

  const iconColorClasses = {
    red: "text-red-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    teal: "text-teal-400"
  };

  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-36 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Hướng dẫn đặt vé
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Quy trình đặt vé đơn giản và nhanh chóng chỉ trong vài phút
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto space-y-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div 
              key={index}
              className={`bg-gradient-to-r ${colorClasses[step.color]} rounded-xl p-8 border backdrop-blur-sm`}
            >
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className={`${iconColorClasses[step.color]} flex-shrink-0`}>
                  <Icon size={40} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    {step.title}
                  </h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Tips */}
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      💡 Mẹo hữu ích:
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-400">
                      {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2">
                          <span className="text-white mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Tips Section */}
      <div className="max-w-5xl mx-auto mt-16">
        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            ⚡ Lưu ý quan trọng
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">Thời gian giữ ghế</h3>
                  <p className="text-sm text-gray-400">Ghế được giữ trong 30 phút. Vui lòng thanh toán trong thời gian này.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">Thanh toán an toàn</h3>
                  <p className="text-sm text-gray-400">Giao dịch được bảo mật qua Stripe, thông tin thẻ không lưu trữ.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email xác nhận</h3>
                  <p className="text-sm text-gray-400">Kiểm tra email ngay sau khi thanh toán, kể cả thư mục spam.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎫</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">Mã QR vé</h3>
                  <p className="text-sm text-gray-400">Mã QR chỉ dùng một lần, không chia sẻ để tránh bị lợi dụng.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">Hủy vé</h3>
                  <p className="text-sm text-gray-400">Có thể hủy vé trước 6 giờ để được hoàn tiền theo chính sách.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">Xem vé mọi lúc</h3>
                  <p className="text-sm text-gray-400">Truy cập "Vé của tôi" để xem lại thông tin vé bất cứ lúc nào.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl p-10 border border-red-500/30">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Sẵn sàng đặt vé ngay?
        </h2>
        <p className="text-gray-300 mb-6">
          Khám phá các bộ phim đang chiếu và đặt vé chỉ trong vài phút
        </p>
        <a 
          href="/movies" 
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Xem phim đang chiếu
        </a>
      </div>
    </div>
  );
};

export default BookingGuide;

