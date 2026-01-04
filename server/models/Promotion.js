import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    // Loại khuyến mãi: 'holiday' (ngày lễ), 'special' (đặc biệt), 'weekly' (hàng tuần)
    type: { type: String, enum: ['holiday', 'special', 'weekly'], default: 'special' },
    // Áp dụng cho ngày cụ thể trong tuần (0=CN, 1=T2, ... 6=T7) - dùng cho weekly
    applicableDays: [{ type: Number, min: 0, max: 6 }],
    // Số lần sử dụng tối đa (0 = không giới hạn)
    maxUsage: { type: Number, default: 0 },
    // Số lần đã sử dụng
    usageCount: { type: Number, default: 0 },
    createdBy: { type: String, ref: 'User' },
}, { timestamps: true });

// Index để tìm kiếm nhanh các promotion đang active
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;
