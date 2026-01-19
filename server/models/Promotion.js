import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    // Loại khuyến mãi: 'holiday' (ngày lễ), 'special' (đặc biệt), 'weekly' (hàng tuần), 'default_banner' (banner mặc định)
    type: { type: String, enum: ['holiday', 'special', 'weekly', 'default_banner'], default: 'special' },
    // Áp dụng cho ngày cụ thể trong tuần (0=CN, 1=T2, ... 6=T7) - dùng cho weekly
    applicableDays: [{ type: Number, min: 0, max: 6 }],
    // Số lần sử dụng tối đa (0 = không giới hạn)
    maxUsage: { type: Number, default: 0 },
    // Số lần đã sử dụng
    usageCount: { type: Number, default: 0 },
    // Số lần sử dụng tối đa cho mỗi tài khoản (0 = không giới hạn)
    maxUsagePerUser: { type: Number, default: 0 },

    // Banner fields - hiển thị khuyến mãi cho người dùng
    bannerImage: { type: String }, // URL hình ảnh banner
    bannerTitle: { type: String }, // Tiêu đề hiển thị trên banner
    bannerSubtitle: { type: String }, // Phụ đề banner
    showBanner: { type: Boolean, default: false }, // Có hiển thị banner không
    bannerOrder: { type: Number, default: 0 }, // Thứ tự hiển thị (số nhỏ hiển thị trước)


    // Default Banner fields - cho banner mặc định (thay thế Marvel)
    isDefaultBanner: { type: Boolean, default: false }, // Đánh dấu là banner mặc định
    defaultBannerMovieTitle: { type: String }, // Tên phim hiển thị
    defaultBannerGenres: { type: String }, // Thể loại phim
    defaultBannerYear: { type: String }, // Năm phát hành
    defaultBannerDuration: { type: String }, // Thời lượng phim
    defaultBannerDescription: { type: String }, // Mô tả ngắn
    defaultBannerBackground: { type: String }, // Background image URL


    createdBy: { type: String, ref: 'User' },
}, { timestamps: true });

// Index để tìm kiếm nhanh các promotion đang active
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;
