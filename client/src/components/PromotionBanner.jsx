import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PromotionBanner = () => {
  const { axios } = useAppContext();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get('/api/promotion/banners');
        console.log('📢 Banner API response:', data);
        if (data?.success && Array.isArray(data.banners) && data.banners.length > 0) {
          setBanners(data.banners);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [axios]);

  // Auto slide
  useEffect(() => {
    if (!isAutoPlay || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length, isAutoPlay]);

  const pauseAutoPlay = useCallback(() => {
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    pauseAutoPlay();
  }, [banners.length, pauseAutoPlay]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    pauseAutoPlay();
  }, [banners.length, pauseAutoPlay]);

  const goToSlide = useCallback(
    (index) => {
      setCurrentIndex(index);
      pauseAutoPlay();
    },
    [pauseAutoPlay]
  );

  if (loading || banners.length === 0) return null;

  return (
    <section className="py-6 md:py-10 bg-base-300">
      <div className="container mx-auto px-4">
        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Title nằm ngay trên banner */}
          <div className="absolute left-4 top-4 md:left-6 md:top-6 z-30">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 backdrop-blur-md ring-1 ring-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-white font-extrabold tracking-wide text-sm md:text-base">
                KHUYẾN MÃI
              </span>
            </div>
          </div>

          {/* Navigation Arrow Left */}
          {banners.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/35 hover:bg-black/55 rounded-full backdrop-blur-sm transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          )}

          {/* Slider */}
          <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {banners.map((banner) => (
                <div key={banner._id} className="flex-shrink-0 w-full">
                  {/* Banner Card */}
                  <div className="relative w-full h-[160px] sm:h-[200px] md:h-[240px] lg:h-[260px] bg-black/20">
                    {banner.bannerImage ? (
                      <>
                        <img
                          src={banner.bannerImage}
                          alt={banner.bannerTitle || banner.name}
                          className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                          loading="lazy"
                        />

                        {/* Overlay để ảnh nhìn “đã” hơn + dễ đọc chữ */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-black/10" />

                        {/* Text overlay (tùy data có/không) */}
                        <div className="absolute left-4 bottom-4 md:left-6 md:bottom-6">
                          <div className="text-white font-bold text-lg sm:text-xl md:text-2xl line-clamp-1 drop-shadow">
                            {banner.bannerTitle || banner.name || 'KHUYẾN MÃI'}
                          </div>

                          {banner.discountPercent ? (
                            <div className="mt-2 inline-flex items-center rounded-full bg-primary/90 px-3 py-1 text-white text-xs sm:text-sm font-semibold">
                              Giảm {banner.discountPercent}%
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                        <div className="text-center p-4">
                          <div className="text-4xl md:text-6xl font-bold text-white mb-2">
                            {banner.discountPercent || 0}%
                          </div>
                          <div className="text-white/90 text-sm md:text-base font-medium">
                            GIẢM GIÁ
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrow Right */}
          {banners.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/35 hover:bg-black/55 rounded-full backdrop-blur-sm transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          )}

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex
                      ? 'w-8 h-2.5 bg-primary'
                      : 'w-2.5 h-2.5 bg-white/35 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PromotionBanner;
