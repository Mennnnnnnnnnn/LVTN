import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Calendar, Tag, Users, Clock, ArrowLeft, Gift } from "lucide-react";

const PromotionDetailPage = () => {
  const { promotionId } = useParams();
  const navigate = useNavigate();
  const { axios } = useAppContext();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const { data } = await axios.get(`/api/promotion/banners/${promotionId}`);
        if (data?.success) setBanner(data.banner);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [axios, promotionId]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPromotionTypeLabel = (type) => {
    switch (type) {
      case 'holiday': return { label: 'Ngày lễ', icon: '🎉' };
      case 'weekly': return { label: 'Hàng tuần', icon: '📅' };
      case 'special': return { label: 'Đặc biệt', icon: '⭐' };
      default: return { label: 'Khuyến mãi', icon: '🎁' };
    }
  };

  const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-t-primary"></div>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 gap-4">
        <Gift className="w-16 h-16 text-gray-600" />
        <p className="text-gray-400 text-lg">Không tìm thấy khuyến mãi.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary hover:bg-primary-dull rounded-full transition"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const typeInfo = getPromotionTypeLabel(banner.type);

  return (
    <div className="min-h-screen bg-base-200 pt-20">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black/20">
          {/* Banner Image */}
          {banner.bannerImage ? (
            <div className="relative">
              <img
                src={banner.bannerImage}
                alt={banner.bannerTitle || banner.name}
                className="w-full h-[260px] md:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Discount badge */}
              {banner.discountPercent && (
                <div className="absolute top-4 right-4 px-4 py-2 bg-primary rounded-full text-white font-bold text-lg">
                  Giảm {banner.discountPercent}%
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[200px] bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl font-bold">{banner.discountPercent || 0}%</div>
                <div className="text-lg mt-2">GIẢM GIÁ</div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-10">
            {/* Title & Type */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white">
                  {banner.bannerTitle || banner.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{typeInfo.icon}</span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                    {typeInfo.label}
                  </span>
                </div>
              </div>

              {banner.discountPercent && !banner.bannerImage && (
                <div className="px-6 py-3 bg-primary rounded-xl text-white font-bold text-xl">
                  -{banner.discountPercent}%
                </div>
              )}
            </div>

            {/* Subtitle */}
            {banner.bannerSubtitle && (
              <p className="text-lg text-primary mb-4">{banner.bannerSubtitle}</p>
            )}

            {/* Description */}
            {banner.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Mô tả</h3>
                <p className="text-white/80 leading-relaxed whitespace-pre-line">{banner.description}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Thời gian áp dụng */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Thời gian áp dụng</span>
                </div>
                <p className="text-white">
                  {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
                </p>
              </div>

              {/* Giới hạn sử dụng */}
              {banner.maxUsagePerUser > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">Giới hạn sử dụng</span>
                  </div>
                  <p className="text-white">
                    Mỗi tài khoản chỉ được sử dụng <strong className="text-yellow-400">{banner.maxUsagePerUser} lần</strong>
                  </p>
                </div>
              )}

              {/* Ngày áp dụng (Weekly) */}
              {banner.type === 'weekly' && banner.applicableDays?.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Ngày áp dụng trong tuần</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {banner.applicableDays.map(day => (
                      <span key={day} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {daysOfWeek[day]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Số lượt sử dụng */}
              {banner.maxUsage > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <Tag className="w-5 h-5" />
                    <span className="font-semibold">Số lượt còn lại</span>
                  </div>
                  <p className="text-white">
                    <strong className="text-orange-400">{Math.max(0, banner.maxUsage - (banner.usageCount || 0))}</strong> / {banner.maxUsage} lượt
                  </p>
                </div>
              )}
            </div>

            {/* Điều kiện áp dụng */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-primary mb-3">📋 Điều kiện áp dụng</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Khuyến mãi chỉ áp dụng khi đặt vé online trên hệ thống
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Áp dụng từ {formatDate(banner.startDate)} đến {formatDate(banner.endDate)}
                </li>
                {banner.maxUsagePerUser > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Mỗi tài khoản chỉ được sử dụng khuyến mãi này {banner.maxUsagePerUser} lần
                  </li>
                )}
                {banner.type === 'weekly' && banner.applicableDays?.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Chỉ áp dụng vào: {banner.applicableDays.map(d => daysOfWeek[d]).join(', ')}
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Không áp dụng đồng thời với các chương trình khuyến mãi khác
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Rạp phim có quyền thay đổi hoặc hủy chương trình mà không cần báo trước
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/movies')}
                className="px-8 py-3 bg-primary hover:bg-primary-dull rounded-full text-white font-semibold transition"
              >
                Đặt vé ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionDetailPage;
