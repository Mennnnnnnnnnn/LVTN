import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowRight, CalendarIcon, ClockIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";

const HeroSection = () => {
  const navigate = useNavigate();
  const { axios } = useAppContext();

  const [promoBanners, setPromoBanners] = useState([]);
  const [defaultBanner, setDefaultBanner] = useState(null);
  const [loadingPromo, setLoadingPromo] = useState(true);
  const [loadingDefault, setLoadingDefault] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Fetch promo banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get("/api/promotion/banners");
        console.log("📢 Banner API response:", data);
        if (data?.success && Array.isArray(data.banners) && data.banners.length > 0) {
          setPromoBanners(data.banners);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoadingPromo(false);
      }
    };
    fetchBanners();
  }, [axios]);

  // Fetch default banner (thay thế Marvel cố định)
  useEffect(() => {
    const fetchDefaultBanner = async () => {
      try {
        const { data } = await axios.get("/api/promotion/default-banner");
        console.log("📢 Default Banner API response:", data);
        if (data?.success && data.defaultBanner) {
          setDefaultBanner(data.defaultBanner);
        }
      } catch (error) {
        console.error("Error fetching default banner:", error);
      } finally {
        setLoadingDefault(false);
      }
    };
    fetchDefaultBanner();
  }, [axios]);

  // Slides: Default banner trước, promo sau
  const slides = useMemo(() => {
    const slideList = [];

    // Thêm default banner (hoặc Marvel fallback) ở đầu
    slideList.push({ type: "default", id: "default-slide", data: defaultBanner });

    // Thêm promo banners
    promoBanners.forEach((b) => {
      slideList.push({ type: "promo", id: b._id, data: b });
    });

    return slideList;
  }, [promoBanners, defaultBanner]);

  // Auto slide (chạy cả Marvel + promo)
  useEffect(() => {
    if (!isAutoPlay || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length, isAutoPlay]);

  const pauseAutoPlay = useCallback(() => {
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    pauseAutoPlay();
  }, [slides.length, pauseAutoPlay]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    pauseAutoPlay();
  }, [slides.length, pauseAutoPlay]);

  const goToSlide = useCallback(
    (index) => {
      setCurrentIndex(index);
      pauseAutoPlay();
    },
    [pauseAutoPlay]
  );

  // Marvel luôn có, promo load sau cũng OK
  if (!loadingPromo && !loadingDefault && slides.length === 0) return null;

  return (
    <section className="w-full relative">
      {/* Arrow Left */}
      {slides.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/35 hover:bg-black/55 rounded-full backdrop-blur-sm transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>
      )}

      {/* Track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="flex-shrink-0 w-full">
              {slide.type === "default" ? (
                // ✅ DEFAULT BANNER - có thể từ DB hoặc fallback Marvel
                <DefaultBannerSlide banner={slide.data} />
              ) : (
                // ✅ PROMO BANNER
                <PromoSlide banner={slide.data} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Arrow Right */}
      {slides.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/35 hover:bg-black/55 rounded-full backdrop-blur-sm transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>
      )}

      {/* Dots (chung cho Marvel + promo) */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-40">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${index === currentIndex
                ? "w-8 h-2.5 bg-primary"
                : "w-2.5 h-2.5 bg-white/35 hover:bg-white/60"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

// ✅ DefaultBannerSlide: Banner mặc định từ DB hoặc fallback Marvel (KHÔNG có link/click)
const DefaultBannerSlide = ({ banner }) => {
  // Nếu có banner từ DB
  if (banner) {
    const backgroundStyle = banner.defaultBannerBackground
      ? { backgroundImage: `url(${banner.defaultBannerBackground})` }
      : {};

    return (
      <div
        className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen'
        style={backgroundStyle}
      >
        <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110'>
          {banner.defaultBannerMovieTitle || banner.name}
        </h1>
        <div className='flex items-center gap-4 text-gray-300 flex-wrap'>
          {banner.defaultBannerGenres && <span>{banner.defaultBannerGenres}</span>}
          {banner.defaultBannerYear && (
            <div className='flex items-center gap-1'>
              <CalendarIcon className='w-4.5 h-4.5' /> {banner.defaultBannerYear}
            </div>
          )}
          {banner.defaultBannerDuration && (
            <div className='flex items-center gap-1'>
              <ClockIcon className='w-4.5 h-4.5' /> {banner.defaultBannerDuration}
            </div>
          )}
        </div>
        {banner.defaultBannerDescription && (
          <p className='max-w-md text-gray-300'>{banner.defaultBannerDescription}</p>
        )}
      </div>
    );
  }

  // Fallback: Hiển thị Marvel mặc định nếu không có banner từ DB (KHÔNG có button/link)
  return (
    <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-[url("/backgroundImage.png")] bg-cover bg-center h-screen'>
      <img src={assets.marvelLogo} alt="" className="max-h-11 lg:h-11 mt-20" />
      <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110'>
        Guardians <br /> of the Galaxy
      </h1>
      <div className='flex items-center gap-4 text-gray-300'>
        <span>Hành động | Phiêu lưu | Khoa học - Viễn tưởng</span>
        <div className='flex items-center gap-1'>
          <CalendarIcon className='w-4.5 h-4.5' /> 2018
        </div>
        <div className='flex items-center gap-1'>
          <ClockIcon className='w-4.5 h-4.5' /> 2h 8m
        </div>
      </div>
      <p className='max-w-md text-gray-300'>
        Trong một thế giới hậu tận thế nơi các thành phố lớn tiêu diệt lẫn nhau để tồn tại, hai người gặp nhau ở London và cố gắng
        ngăn chặn mọi âm mưu.
      </p>
    </div>
  );
};

// ✅ PromoSlide: copy UI PromotionBanner của bạn, chỉ bỏ phần map + arrows/dots
const PromoSlide = ({ banner }) => {
  const navigate = useNavigate();

  const goDetail = () => {
    if (!banner?._id) return;
    navigate(`/promotion/${banner._id}`);
  };

  return (
    <section className="w-full h-screen relative bg-black/20">
      {banner?.bannerImage ? (
        <>
          {/* ✅ Clickable layer */}
          <button
            type="button"
            onClick={goDetail}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={`Xem chi tiết khuyến mãi ${banner.bannerTitle || banner.name || ""}`}
          />

          <img
            src={banner.bannerImage}
            alt={banner.bannerTitle || banner.name}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-black/10" />

          <div className="absolute left-6 md:left-16 bottom-10 md:bottom-16 z-30">
            <div className="text-white font-semibold text-4xl md:text-[70px] md:leading-18 max-w-3xl drop-shadow">
              {banner.bannerTitle || banner.name || "KHUYẾN MÃI"}
            </div>

            {banner.discountPercent ? (
              <div className="mt-4 inline-flex items-center rounded-full bg-primary/90 px-5 py-2 text-white text-sm md:text-base font-semibold">
                Giảm {banner.discountPercent}%
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
          <button
            type="button"
            onClick={goDetail}
            className="text-center p-4 text-white"
          >
            <div className="text-6xl md:text-8xl font-bold mb-2">
              {banner?.discountPercent || 0}%
            </div>
            <div className="text-white/90 text-base md:text-lg font-medium">
              GIẢM GIÁ (nhấn xem chi tiết)
            </div>
          </button>
        </div>
      )}
    </section>
  );
};

export default HeroSection