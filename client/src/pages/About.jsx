import React from 'react';
import { Calendar, Users, Target, Heart, Award, Zap } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-36 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Về QuickShow
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Nền tảng đặt vé và quản lý sự kiện hàng đầu tại Việt Nam
        </p>
      </div>

      {/* Story Section */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="bg-gray-800/50 rounded-xl p-8 md:p-12 backdrop-blur-sm border border-gray-700">
          <h2 className="text-3xl font-bold text-white mb-6">Về dự án</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              QuickShow là một dự án phát triển năm <span className="text-white font-semibold">2026</span>, 
              nhằm mục đích tạo ra một nền tảng đặt vé xem phim trực tuyến đơn giản và tiện lợi.
            </p>
            <p>
              Dự án tập trung vào việc cải thiện trải nghiệm người dùng khi đặt vé xem phim, 
              giúp giảm thiểu thời gian chờ đợi và tăng tính linh hoạt trong việc lựa chọn suất chiếu, 
              ghế ngồi phù hợp với nhu cầu cá nhân.
            </p>
            <p>
              Với giao diện thân thiện và các tính năng quản lý hiện đại, QuickShow hướng đến việc 
              mang lại giải pháp đặt vé điện tử hiệu quả cho các rạp chiếu phim.
            </p>
          </div>
        </div>
      </div>

      {/* Key Info Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-8 border border-blue-500/30">
          <Calendar className="text-blue-400 mb-4" size={40} />
          <h3 className="text-2xl font-bold text-white mb-2">2026</h3>
          <p className="text-gray-300">Năm phát triển</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-8 border border-purple-500/30">
          <Zap className="text-purple-400 mb-4" size={40} />
          <h3 className="text-2xl font-bold text-white mb-2">Nhanh chóng</h3>
          <p className="text-gray-300">Đặt vé trong vài giây</p>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-8 border border-green-500/30">
          <Award className="text-green-400 mb-4" size={40} />
          <h3 className="text-2xl font-bold text-white mb-2">Hiện đại</h3>
          <p className="text-gray-300">Công nghệ web tiên tiến</p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8 mb-20">
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Target className="text-red-500" size={32} />
            <h2 className="text-2xl font-bold text-white">Mục tiêu</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Xây dựng một hệ thống đặt vé xem phim trực tuyến đơn giản, dễ sử dụng, 
            giúp người dùng tiết kiệm thời gian và tối ưu hóa quy trình quản lý cho rạp chiếu.
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-pink-500" size={32} />
            <h2 className="text-2xl font-bold text-white">Ứng dụng</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Phù hợp cho các rạp chiếu phim vừa và nhỏ, giúp số hóa quy trình bán vé 
            và quản lý thông tin khách hàng một cách hiệu quả.
          </p>
        </div>
      </div>

      {/* Core Features */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Tính năng chính</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-yellow-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
              <Zap className="text-yellow-500" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Đặt vé nhanh</h3>
            <p className="text-gray-400 text-sm">
              Giao diện đơn giản, chọn ghế trực quan, thanh toán dễ dàng
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <Users className="text-blue-500" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Quản lý hiệu quả</h3>
            <p className="text-gray-400 text-sm">
              Hệ thống admin quản lý phim, suất chiếu và đặt chỗ tập trung
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <Award className="text-green-500" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Responsive</h3>
            <p className="text-gray-400 text-sm">
              Hoạt động mượt mà trên mọi thiết bị từ máy tính đến điện thoại
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-2xl mx-auto mt-20 text-center bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl p-10 border border-red-500/30">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Trải nghiệm đặt vé dễ dàng với QuickShow
        </h2>
        <p className="text-gray-300 mb-6">
          Khám phá các bộ phim đang chiếu và đặt vé ngay chỉ với vài thao tác đơn giản
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

export default About;

