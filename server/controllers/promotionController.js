import Promotion from "../models/Promotion.js";
import Booking from "../models/Booking.js";

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
        const {
            name, description, discountPercent, startDate, endDate, type, applicableDays, maxUsage, maxUsagePerUser,
            bannerImage, bannerTitle, bannerSubtitle, showBanner, bannerOrder,
            isDefaultBanner, defaultBannerMovieTitle, defaultBannerGenres, defaultBannerYear,
            defaultBannerDuration, defaultBannerDescription, defaultBannerBackground
        } = req.body;

        // Validate - Banner mặc định không cần discountPercent
        if (!name || !startDate || !endDate) {
            return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        // Chỉ validate discountPercent nếu không phải banner mặc định
        if (!isDefaultBanner && (discountPercent === undefined || discountPercent === null || discountPercent === '')) {
            return res.json({ success: false, message: 'Vui lòng điền phần trăm giảm giá' });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.json({ success: false, message: 'Ngày bắt đầu phải trước ngày kết thúc' });
        }

        const finalDiscountPercent = discountPercent || 0;
        if (finalDiscountPercent < 0 || finalDiscountPercent > 100) {
            return res.json({ success: false, message: 'Phần trăm giảm giá phải từ 0-100' });
        }

        const promotion = await Promotion.create({
            name,
            description,
            discountPercent: finalDiscountPercent,
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
            // Default banner fields
            isDefaultBanner: isDefaultBanner || false,
            defaultBannerMovieTitle: defaultBannerMovieTitle || '',
            defaultBannerGenres: defaultBannerGenres || '',
            defaultBannerYear: defaultBannerYear || '',
            defaultBannerDuration: defaultBannerDuration || '',
            defaultBannerDescription: defaultBannerDescription || '',
            defaultBannerBackground: defaultBannerBackground || '',
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
        const {
            name, description, discountPercent, startDate, endDate, type, applicableDays, maxUsage, maxUsagePerUser, isActive,
            bannerImage, bannerTitle, bannerSubtitle, showBanner, bannerOrder,
            isDefaultBanner, defaultBannerMovieTitle, defaultBannerGenres, defaultBannerYear,
            defaultBannerDuration, defaultBannerDescription, defaultBannerBackground
        } = req.body;

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
        // Default banner fields
        if (isDefaultBanner !== undefined) promotion.isDefaultBanner = isDefaultBanner;
        if (defaultBannerMovieTitle !== undefined) promotion.defaultBannerMovieTitle = defaultBannerMovieTitle;
        if (defaultBannerGenres !== undefined) promotion.defaultBannerGenres = defaultBannerGenres;
        if (defaultBannerYear !== undefined) promotion.defaultBannerYear = defaultBannerYear;
        if (defaultBannerDuration !== undefined) promotion.defaultBannerDuration = defaultBannerDuration;
        if (defaultBannerDescription !== undefined) promotion.defaultBannerDescription = defaultBannerDescription;
        if (defaultBannerBackground !== undefined) promotion.defaultBannerBackground = defaultBannerBackground;

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
            // ✅ thêm _id để frontend click qua detail
            .select('_id name discountPercent bannerImage bannerTitle bannerSubtitle bannerOrder startDate endDate')
            .sort({ bannerOrder: 1 });

        res.json({ success: true, banners });
    } catch (error) {
        console.error('Error fetching promotion banners:', error);
        res.json({ success: false, message: error.message });
    }
};
// ✅ Lấy chi tiết 1 banner khuyến mãi theo ID (Public)
export const getPromotionBannerDetail = async (req, res) => {
    try {
        const { promotionId } = req.params;

        const promotion = await Promotion.findById(promotionId).select(
            '_id name description discountPercent startDate endDate isActive type applicableDays maxUsage usageCount maxUsagePerUser bannerImage bannerTitle bannerSubtitle showBanner bannerOrder'
        );

        if (!promotion) {
            return res.json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        // ✅ Nếu bạn muốn chỉ cho xem banner còn hiệu lực thì mở comment đoạn này
        // const now = new Date();
        // if (
        //     !promotion.isActive ||
        //     !promotion.showBanner ||
        //     promotion.startDate > now ||
        //     promotion.endDate < now
        // ) {
        //     return res.json({ success: false, message: 'Khuyến mãi không khả dụng' });
        // }

        res.json({ success: true, banner: promotion });
    } catch (error) {
        console.error('Error fetching promotion banner detail:', error);
        res.json({ success: false, message: error.message });
    }
};

// ✅ Lấy banner mặc định (thay thế Marvel) - Public
export const getDefaultBanner = async (req, res) => {
    try {
        const now = new Date();

        // Tìm banner mặc định đang active
        const defaultBanner = await Promotion.findOne({
            isActive: true,
            isDefaultBanner: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ bannerOrder: 1 });

        if (!defaultBanner) {
            // Trả về null nếu không có banner mặc định
            return res.json({ success: true, defaultBanner: null });
        }

        res.json({ success: true, defaultBanner });
    } catch (error) {
        console.error('Error fetching default banner:', error);
        res.json({ success: false, message: error.message });
    }
};

// ✅ Lấy danh sách khuyến mãi cho user có thể chọn (có kiểm tra đã dùng chưa) - Protected
export const getAvailablePromotionsForUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const now = new Date();
        const today = now.getDay();

        // Lấy tất cả khuyến mãi đang active và còn hiệu lực (trừ default_banner)
        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            type: { $ne: 'default_banner' }, // Không bao gồm banner mặc định
            $or: [
                { maxUsage: 0 },
                { $expr: { $lt: ['$usageCount', '$maxUsage'] } }
            ]
        });

        // Kiểm tra từng promotion xem user đã dùng chưa
        const availablePromotions = [];

        for (const promo of promotions) {
            // Kiểm tra ngày áp dụng (weekly)
            if (promo.type === 'weekly' && promo.applicableDays.length > 0) {
                if (!promo.applicableDays.includes(today)) {
                    continue;
                }
            }

            // Đếm số lần user đã sử dụng promotion này
            const userUsageCount = await Booking.countDocuments({
                user: userId,
                promotionApplied: promo._id,
                ispaid: true,
                status: { $ne: 'cancelled' }
            });

            // Kiểm tra giới hạn sử dụng cho mỗi user
            const canUse = promo.maxUsagePerUser === 0 || userUsageCount < promo.maxUsagePerUser;
            const remainingUsage = promo.maxUsagePerUser === 0 ? -1 : promo.maxUsagePerUser - userUsageCount;

            availablePromotions.push({
                _id: promo._id,
                name: promo.name,
                description: promo.description,
                discountPercent: promo.discountPercent,
                type: promo.type,
                startDate: promo.startDate,
                endDate: promo.endDate,
                maxUsagePerUser: promo.maxUsagePerUser,
                userUsageCount: userUsageCount,
                remainingUsage: remainingUsage, // -1 = không giới hạn
                canUse: canUse
            });
        }

        res.json({ success: true, promotions: availablePromotions });
    } catch (error) {
        console.error('Error fetching available promotions:', error);
        res.json({ success: false, message: error.message });
    }
};

// ✅ Kiểm tra 1 khuyến mãi cụ thể cho user - Protected
export const checkPromotionForUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { promotionId } = req.params;
        const now = new Date();
        const today = now.getDay();

        const promotion = await Promotion.findById(promotionId);

        if (!promotion) {
            return res.json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        // Kiểm tra khuyến mãi còn hiệu lực
        if (!promotion.isActive || promotion.startDate > now || promotion.endDate < now) {
            return res.json({ success: false, message: 'Khuyến mãi đã hết hạn hoặc chưa bắt đầu' });
        }

        // Kiểm tra ngày áp dụng (weekly)
        if (promotion.type === 'weekly' && promotion.applicableDays.length > 0) {
            if (!promotion.applicableDays.includes(today)) {
                return res.json({ success: false, message: 'Khuyến mãi không áp dụng vào hôm nay' });
            }
        }

        // Kiểm tra tổng số lượt đã dùng
        if (promotion.maxUsage > 0 && promotion.usageCount >= promotion.maxUsage) {
            return res.json({ success: false, message: 'Khuyến mãi đã hết lượt sử dụng' });
        }

        // Đếm số lần user đã sử dụng
        const userUsageCount = await Booking.countDocuments({
            user: userId,
            promotionApplied: promotionId,
            ispaid: true,
            status: { $ne: 'cancelled' }
        });

        // Kiểm tra giới hạn cho mỗi user
        if (promotion.maxUsagePerUser > 0 && userUsageCount >= promotion.maxUsagePerUser) {
            return res.json({
                success: false,
                message: `Bạn đã sử dụng khuyến mãi này ${userUsageCount}/${promotion.maxUsagePerUser} lần`
            });
        }

        res.json({
            success: true,
            promotion: {
                _id: promotion._id,
                name: promotion.name,
                description: promotion.description,
                discountPercent: promotion.discountPercent,
                type: promotion.type,
                maxUsagePerUser: promotion.maxUsagePerUser,
                userUsageCount: userUsageCount,
                remainingUsage: promotion.maxUsagePerUser === 0 ? -1 : promotion.maxUsagePerUser - userUsageCount
            }
        });
    } catch (error) {
        console.error('Error checking promotion:', error);
        res.json({ success: false, message: error.message });
    }
};

