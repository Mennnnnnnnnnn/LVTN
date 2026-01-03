import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Phone, Mail, MapPin } from 'lucide-react';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <footer className="px-6 md:px-16 lg:px-36 mt-40 w-full text-gray-300">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
        {/* Company Info */}
        <div className="md:max-w-96">
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img className="w-36 h-auto cursor-pointer" src={assets.logo} alt="logo" />
          </Link>
          <p className="mt-6 text-sm">
            QuickShow là nền tảng đặt vé và quản lý sự kiện nhanh chóng, tiện lợi, giúp bạn khám phá và trải nghiệm những chương trình giải trí hấp dẫn chỉ với vài thao tác đơn giản.
          </p>
          
          {/* Social Media */}
          <div className="flex items-center gap-4 mt-6">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-pink-500 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-red-500 transition-colors"
              aria-label="Youtube"
            >
              <Youtube size={20} />
            </a>
          </div>
        </div>

        {/* Links Section */}
        <div className="flex-1 flex flex-wrap items-start md:justify-end gap-10 md:gap-16">
          {/* Company Links */}
          <div>
            <h2 className="font-semibold mb-5">Công ty</h2>
            <ul className="text-sm space-y-2">
              <li>
                <Link 
                  to="/" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h2 className="font-semibold mb-5">Hỗ trợ</h2>
            <ul className="text-sm space-y-2">
              <li>
                <Link 
                  to="/faq" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link 
                  to="/booking-guide" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Hướng dẫn đặt vé
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy-policy" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link 
                  to="/refund-policy" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Chính sách hoàn vé
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="font-semibold mb-5">Liên hệ</h2>
            <div className="text-sm space-y-3">
              <a 
                href="tel:0933331843" 
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone size={16} />
                <span>0933 331 843</span>
              </a>
              <a 
                href="mailto:quickshow@gmail.com" 
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail size={16} />
                <span>quickshow@gmail.com</span>
              </a>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. HCM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <p className="pt-4 text-center text-sm pb-5">
        {new Date().getFullYear()} © QuickShow. Bảo lưu mọi quyền.
      </p>
    </footer>
  )
}

export default Footer