import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden mb-4 bg-gray-800/50 backdrop-blur-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-700/30 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white pr-4">{question}</h3>
        {isOpen ? (
          <ChevronUp className="text-red-500 flex-shrink-0" size={24} />
        ) : (
          <ChevronDown className="text-gray-400 flex-shrink-0" size={24} />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-gray-300 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqData = [
    {
      question: "Làm sao để đặt vé xem phim trên QuickShow?",
      answer: (
        <div className="space-y-2">
          <p>Để đặt vé, bạn thực hiện theo các bước sau:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Đăng nhập vào tài khoản của bạn</li>
            <li>Chọn phim bạn muốn xem từ trang chủ hoặc danh sách phim</li>
            <li>Chọn ngày và suất chiếu phù hợp</li>
            <li>Chọn ghế ngồi trên sơ đồ phòng chiếu</li>
            <li>Xác nhận thông tin và thanh toán</li>
            <li>Nhận vé qua email với mã QR</li>
          </ol>
        </div>
      )
    },
    {
      question: "QuickShow hỗ trợ những hình thức thanh toán nào?",
      answer: "QuickShow hiện hỗ trợ thanh toán qua Stripe, bao gồm thẻ tín dụng/ghi nợ quốc tế (Visa, Mastercard, American Express). Giao dịch được bảo mật và xử lý nhanh chóng."
    },
    {
      question: "Làm sao để hủy vé đã đặt?",
      answer: (
        <div className="space-y-2">
          <p>Để hủy vé, bạn làm theo các bước sau:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Đăng nhập và vào mục "Vé của tôi"</li>
            <li>Tìm vé cần hủy trong danh sách</li>
            <li>Nhấn nút "Hủy vé" (chỉ hiển thị nếu còn đủ thời gian)</li>
            <li>Xác nhận hủy vé</li>
            <li>Nhận email xác nhận và thông tin hoàn tiền</li>
          </ol>
          <p className="mt-2 text-yellow-400">
            <strong>Lưu ý:</strong> Bạn chỉ có thể hủy vé trước suất chiếu ít nhất 6 giờ.
          </p>
        </div>
      )
    },
    {
      question: "Chính sách hoàn tiền khi hủy vé như thế nào?",
      answer: (
        <div className="space-y-2">
          <p>Tỷ lệ hoàn tiền phụ thuộc vào thời gian hủy:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>≥ 24 giờ trước suất chiếu:</strong> Hoàn 80%</li>
            <li><strong>12-24 giờ trước suất chiếu:</strong> Hoàn 50%</li>
            <li><strong>6-12 giờ trước suất chiếu:</strong> Hoàn 20%</li>
            <li><strong>Dưới 6 giờ:</strong> Không được hủy</li>
          </ul>
          <p className="mt-2">Số tiền sẽ được hoàn lại vào tài khoản gốc trễ nhất trong vòng 3 ngày làm việc.</p>
        </div>
      )
    },
    {
      question: "Mã QR trong email dùng để làm gì?",
      answer: "Mã QR là vé điện tử của bạn. Khi đến rạp, bạn chỉ cần xuất trình mã QR này (có thể hiển thị trên điện thoại hoặc in ra) tại quầy check-in để được vào xem phim. Mỗi mã QR chỉ sử dụng được một lần và không nên chia sẻ với người khác."
    },
    {
      question: "Tôi nên đến rạp trước bao lâu?",
      answer: "Chúng tôi khuyến nghị bạn đến rạp trước ít nhất 15 phút so với giờ chiếu để có thời gian check-in, mua đồ ăn nhẹ (nếu muốn) và tìm chỗ ngồi. Phim sẽ bắt đầu đúng giờ đã ghi trên vé."
    },
    {
      question: "Có thể đổi ghế hoặc suất chiếu sau khi đã đặt không?",
      answer: "Hiện tại hệ thống chưa hỗ trợ đổi ghế hoặc suất chiếu trực tiếp. Nếu bạn muốn thay đổi, bạn cần hủy vé hiện tại (chịu phí hủy theo chính sách) và đặt vé mới cho suất chiếu/ghế mong muốn."
    },
    {
      question: "Vé có thời hạn sử dụng không?",
      answer: "Vé chỉ có giá trị cho suất chiếu cụ thể mà bạn đã chọn (ngày, giờ, phòng chiếu). Vé không thể sử dụng cho suất chiếu khác hoặc chuyển nhượng cho người khác."
    },
    {
      question: "Thanh toán thất bại, tôi phải làm gì?",
      answer: (
        <div className="space-y-2">
          <p>Nếu thanh toán thất bại, bạn có thể:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Kiểm tra lại thông tin thẻ và thử lại</li>
            <li>Đảm bảo thẻ có đủ số dư</li>
            <li>Thử dùng thẻ khác</li>
            <li>Liên hệ ngân hàng nếu thẻ bị khóa giao dịch online</li>
          </ul>
          <p className="mt-2 text-yellow-400">
            <strong>Lưu ý:</strong> Ghế bạn chọn sẽ được giữ trong 30 phút. Nếu không thanh toán trong thời gian này, ghế sẽ tự động được giải phóng.
          </p>
        </div>
      )
    },
    {
      question: "Tôi không nhận được email xác nhận vé?",
      answer: (
        <div className="space-y-2">
          <p>Nếu không nhận được email, hãy thử:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Kiểm tra thư mục Spam/Junk</li>
            <li>Đợi thêm vài phút (email có thể bị delay)</li>
            <li>Kiểm tra lại địa chỉ email trong tài khoản</li>
            <li>Xem vé trong mục "Vé của tôi" trên website</li>
          </ul>
          <p className="mt-2">Nếu vẫn không thấy, vui lòng liên hệ hỗ trợ: <a href="mailto:quickshow@gmail.com" className="text-red-500 hover:underline">quickshow@gmail.com</a></p>
        </div>
      )
    },
    {
      question: "Có được mang đồ ăn ngoài vào rạp không?",
      answer: "Chính sách về đồ ăn ngoài phụ thuộc vào từng rạp đối tác. Chúng tôi khuyến khích bạn mua đồ ăn tại quầy của rạp để có trải nghiệm tốt nhất và hỗ trợ rạp duy trì chất lượng dịch vụ."
    },
    {
      question: "Làm sao để liên hệ hỗ trợ khách hàng?",
      answer: (
        <div className="space-y-2">
          <p>Bạn có thể liên hệ với chúng tôi qua:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Email:</strong> <a href="mailto:quickshow@gmail.com" className="text-red-500 hover:underline">quickshow@gmail.com</a></li>
            <li><strong>Hotline:</strong> <a href="tel:0933331843" className="text-red-500 hover:underline">0933 331 843</a></li>
            <li><strong>Địa chỉ:</strong> Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. HCM</li>
          </ul>
          <p className="mt-2">Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-36 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HelpCircle className="text-red-500" size={40} />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Câu hỏi thường gặp
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Tìm câu trả lời cho những thắc mắc phổ biến về dịch vụ đặt vé của QuickShow
        </p>
      </div>

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto">
        {faqData.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
          />
        ))}
      </div>

      {/* Contact Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl p-10 border border-red-500/30">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Không tìm thấy câu trả lời?
        </h2>
        <p className="text-gray-300 mb-6">
          Đừng lo lắng! Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp bạn
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a 
            href="mailto:quickshow@gmail.com" 
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Gửi email
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

export default FAQ;

