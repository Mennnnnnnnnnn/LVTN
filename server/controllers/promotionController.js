import Promotion from "../models/Promotion.js";

// Lấy tất cả khuyến mãi (Admin)
export const getAllPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({ createdAt: -1 });
        res.json({ success: true, promotions });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.json({ success: false, message: error.message });
    }
};

// Tạo khuyến mãi mới (Admin)
export const createPromotion = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { name, description, discountPercent, startDate, endDate, type, applicableDays, maxUsage, maxUsagePerUser, bannerImage, bannerTitle, bannerSubtitle, showBanner, bannerOrder } = req.body;

        // Validate
        if (!name || !discountPercent || !startDate || !endDate) {
            return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.json({ success: false, message: 'Ngày bắt đầu phải trước ngày kết thúc' });
        }

        if (discountPercent < 0 || discountPercent > 100) {
            return res.json({ success: false, message: 'Phần trăm giảm giá phải từ 0-100' });
        }

        const promotion = await Promotion.create({
            name,
            description,
            discountPercent,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type: type || 'special',
            applicableDays: applicableDays || [],
            maxUsage: maxUsage || 0,
            maxUsagePerUser: maxUsagePerUser || 0,
            bannerImage: bannerImage || '',
            bannerTitle: bannerTitle || '',
            bannerSubtitle: bannerSubtitle || '',
            showBanner: showBanner || false,
            bannerOrder: bannerOrder || 0,
            createdBy: userId
        });

        res.json({ success: true, message: 'Tạo khuyến mãi thành công', promotion });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.json({ success: false, message: error.message });
    }
};

// Cập nhật khuyến mãi (Admin)
export const updatePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const { name, description, discountPercent, startDate, endDate, type, applicableDays, maxUsage, maxUsagePerUser, isActive, bannerImage, bannerTitle, bannerSubtitle, showBanner, bannerOrder } = req.body;

        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            return res.json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        // Update fields
        if (name) promotion.name = name;
        if (description !== undefined) promotion.description = description;
        if (discountPercent !== undefined) promotion.discountPercent = discountPercent;
        if (startDate) promotion.startDate = new Date(startDate);
        if (endDate) promotion.endDate = new Date(endDate);
        if (type) promotion.type = type;
        if (applicableDays) promotion.applicableDays = applicableDays;
        if (maxUsage !== undefined) promotion.maxUsage = maxUsage;
        if (maxUsagePerUser !== undefined) promotion.maxUsagePerUser = maxUsagePerUser;
        if (isActive !== undefined) promotion.isActive = isActive;
        if (bannerImage !== undefined) promotion.bannerImage = bannerImage;
        if (bannerTitle !== undefined) promotion.bannerTitle = bannerTitle;
        if (bannerSubtitle !== undefined) promotion.bannerSubtitle = bannerSubtitle;
        if (showBanner !== undefined) promotion.showBanner = showBanner;
        if (bannerOrder !== undefined) promotion.bannerOrder = bannerOrder;

        await promotion.save();
        res.json({ success: true, message: 'Cập nhật khuyến mãi thành công', promotion });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.json({ success: false, message: error.message });
    }
};

// Xóa khuyến mãi (Admin)
export const deletePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;

        const promotion = await Promotion.findByIdAndDelete(promotionId);
        if (!promotion) {
            return res.json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        res.json({ success: true, message: 'Xóa khuyến mãi thành công' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.json({ success: false, message: error.message });
    }
};

// Lấy khuyến mãi hiện tại đang áp dụng (Public)
export const getActivePromotions = async (req, res) => {
    try {
        const now = new Date();
        const today = now.getDay(); // 0 = CN, 1 = T2, ...

        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $or: [
                { maxUsage: 0 }, // Không giới hạn
                { $expr: { $lt: ['$usageCount', '$maxUsage'] } } // Còn lượt sử dụng
            ]
        });

        // Lọc thêm theo ngày trong tuần nếu là loại weekly
        const applicablePromotions = promotions.filter(promo => {
            if (promo.type === 'weekly' && promo.applicableDays.length > 0) {
                return promo.applicableDays.includes(today);
            }
            return true;
        });

        // Trả về promotion có % giảm cao nhất
        if (applicablePromotions.length > 0) {
            const bestPromotion = applicablePromotions.reduce((best, current) =>
                current.discountPercent > best.discountPercent ? current : best
            );
            res.json({ success: true, promotion: bestPromotion, allPromotions: applicablePromotions });
        } else {
            res.json({ success: true, promotion: null, allPromotions: [] });
        }
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        res.json({ success: false, message: error.message });
    }
};

// Toggle trạng thái khuyến mãi (Admin)
export const togglePromotionStatus = async (req, res) => {
    try {
        const { promotionId } = req.params;

        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            return res.json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        promotion.isActive = !promotion.isActive;
        await promotion.save();

        res.json({
            success: true,
            message: `Khuyến mãi đã được ${promotion.isActive ? 'kích hoạt' : 'tắt'}`,
            promotion
        });
    } catch (error) {
        console.error('Error toggling promotion:', error);
        res.json({ success: false, message: error.message });
    }
};

// Lấy danh sách banner khuyến mãi (Public)
export const getPromotionBanners = async (req, res) => {
    try {
        const now = new Date();

        const banners = await Promotion.find({
            isActive: true,
            showBanner: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        })
            .select('name discountPercent bannerImage bannerTitle bannerSubtitle bannerOrder startDate endDate')
            .sort({ bannerOrder: 1 });

        res.json({ success: true, banners });
    } catch (error) {
        console.error('Error fetching promotion banners:', error);
        res.json({ success: false, message: error.message });
    }
};
