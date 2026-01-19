
import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Promotion from "../models/Promotion.js";
import User from "../models/User.js";
import stripe from 'stripe';


//chức năng kiểm tra tình trạng chỗ ngồi đã chọn cho một bộ phim
const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId);
        if (!showData) {
            return false;
        }

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);
        return !isAnySeatTaken;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

// Hàm kiểm tra số lần user đã sử dụng một promotion
const getUserPromotionUsageCount = async (userId, promotionId) => {
    try {
        const count = await Booking.countDocuments({
            user: userId,
            promotionApplied: promotionId,
            ispaid: true,
            status: { $ne: 'cancelled' }
        });
        return count;
    } catch (error) {
        console.error('Error counting user promotion usage:', error);
        return 0;
    }
};

// Hàm lấy khuyến mãi tốt nhất hiện tại cho user
const getBestActivePromotion = async (userId) => {
    try {
        const now = new Date();
        const today = now.getDay();

        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $or: [
                { maxUsage: 0 },
                { $expr: { $lt: ['$usageCount', '$maxUsage'] } }
            ]
        });

        // Lọc các promotion có thể áp dụng cho user
        const applicablePromotions = [];

        for (const promo of promotions) {
            // Kiểm tra ngày áp dụng (weekly)
            if (promo.type === 'weekly' && promo.applicableDays.length > 0) {
                if (!promo.applicableDays.includes(today)) {
                    continue;
                }
            }

            // Kiểm tra giới hạn sử dụng cho mỗi user
            if (promo.maxUsagePerUser > 0) {
                const userUsageCount = await getUserPromotionUsageCount(userId, promo._id);
                if (userUsageCount >= promo.maxUsagePerUser) {
                    continue; // User đã sử dụng hết số lần cho phép
                }
            }

            applicablePromotions.push(promo);
        }

        if (applicablePromotions.length > 0) {
            return applicablePromotions.reduce((best, current) =>
                current.discountPercent > best.discountPercent ? current : best
            );
        }
        return null;
    } catch (error) {
        console.error('Error getting promotion:', error);
        return null;
    }
};

export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { showId, selectedSeats, promotionId: selectedPromotionId } = req.body;
        const { origin } = req.headers;
        //kiểm tra xem chỗ ngồi có sẵn cho chương trình đã chọn không
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

        if (!isAvailable) {
            return res.json({ success: false, message: 'Một hoặc nhiều ghế đã chọn đã được đặt. Vui lòng chọn ghế khác.' });
        }
        // Get the show details
        const showData = await Show.findById(showId).populate('movie').populate('hall');

        // ✅ Check if hall is active
        if (!showData.hall || showData.hall.status !== 'active') {
            return res.json({
                success: false,
                message: showData.hall?.status === 'maintenance'
                    ? `Phòng chiếu đang bảo trì. Lý do: ${showData.hall.maintenanceNote || 'Đang bảo trì'}`
                    : 'Phòng chiếu không khả dụng'
            });
        }

        // Constants phụ thu
        const COUPLE_SEAT_SURCHARGE = 10000;
        const EVENING_SURCHARGE = 10000;

        // Tính giá base với priceMultiplier
        const basePrice = showData.showPrice * showData.hall.priceMultiplier;

        // Check suất tối (sau 17h)
        const showHour = showData.showDateTime.getHours();
        const isEveningShow = showHour >= 17;

        // Tính tổng tiền cho từng ghế
        let totalAmount = 0;
        selectedSeats.forEach(seat => {
            let seatPrice = basePrice;

            // Phụ thu ghế đôi
            const row = seat[0];
            if (showData.hall.seatLayout?.coupleSeatsRows?.includes(row)) {
                seatPrice += COUPLE_SEAT_SURCHARGE;
            }

            // Phụ thu suất tối
            if (isEveningShow) {
                seatPrice += EVENING_SURCHARGE;
            }

            totalAmount += seatPrice;
        });

        // Lưu giá gốc
        const originalAmount = totalAmount;

        // Kiểm tra và áp dụng khuyến mãi do user chọn hoặc tự động tìm khuyến mãi tốt nhất
        let activePromotion = null;
        let discountAmount = 0;
        let promotionId = null;

        if (selectedPromotionId) {
            // User đã chọn khuyến mãi cụ thể - validate nó
            const now = new Date();
            const today = now.getDay();
            const selectedPromo = await Promotion.findById(selectedPromotionId);

            if (selectedPromo) {
                // Kiểm tra các điều kiện
                let isValid = true;
                let errorMessage = '';

                if (!selectedPromo.isActive) {
                    isValid = false;
                    errorMessage = 'Khuyến mãi không còn hoạt động';
                } else if (selectedPromo.startDate > now || selectedPromo.endDate < now) {
                    isValid = false;
                    errorMessage = 'Khuyến mãi đã hết hạn hoặc chưa bắt đầu';
                } else if (selectedPromo.type === 'weekly' && selectedPromo.applicableDays.length > 0 && !selectedPromo.applicableDays.includes(today)) {
                    isValid = false;
                    errorMessage = 'Khuyến mãi không áp dụng vào hôm nay';
                } else if (selectedPromo.maxUsage > 0 && selectedPromo.usageCount >= selectedPromo.maxUsage) {
                    isValid = false;
                    errorMessage = 'Khuyến mãi đã hết lượt sử dụng';
                } else {
                    // Kiểm tra giới hạn cho mỗi user
                    const userUsageCount = await getUserPromotionUsageCount(userId, selectedPromotionId);
                    if (selectedPromo.maxUsagePerUser > 0 && userUsageCount >= selectedPromo.maxUsagePerUser) {
                        isValid = false;
                        errorMessage = `Bạn đã sử dụng khuyến mãi này ${userUsageCount}/${selectedPromo.maxUsagePerUser} lần`;
                    }
                }

                if (!isValid) {
                    return res.json({ success: false, message: errorMessage });
                }

                activePromotion = selectedPromo;
            } else {
                return res.json({ success: false, message: 'Không tìm thấy khuyến mãi' });
            }
        } else {
            // Không chọn khuyến mãi - tự động tìm khuyến mãi tốt nhất
            activePromotion = await getBestActivePromotion(userId);
        }

        if (activePromotion) {
            discountAmount = Math.floor(totalAmount * activePromotion.discountPercent / 100);
            totalAmount = totalAmount - discountAmount;
            promotionId = activePromotion._id;

            console.log('🎉 Promotion applied:', {
                name: activePromotion.name,
                discountPercent: activePromotion.discountPercent,
                originalAmount,
                discountAmount,
                finalAmount: totalAmount,
                promotionId
            });

            // Tăng số lần sử dụng của promotion
            await Promotion.findByIdAndUpdate(activePromotion._id, {
                $inc: { usageCount: 1 }
            });
        } else {
            console.log('❌ No promotion applied');
        }

        //create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: totalAmount,
            originalAmount: originalAmount,
            promotionApplied: promotionId,
            discountAmount: discountAmount,
            bookedSeats: selectedSeats
        });

        console.log('📋 Booking created:', {
            bookingId: booking._id,
            originalAmount: booking.originalAmount,
            discountAmount: booking.discountAmount,
            amount: booking.amount,
            promotionApplied: booking.promotionApplied
        });

        selectedSeats.map((seat) => {
            showData.occupiedSeats[seat] = userId;
        });

        showData.markModified('occupiedSeats');
        await showData.save();
        //khởi tạo cổng thanh toán(stripe)
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        //tạo mục hàng cho stripe
        const line_items = [
            {
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: activePromotion
                            ? `${showData.movie.title} (Giảm ${activePromotion.discountPercent}% - ${activePromotion.name})`
                            : showData.movie.title
                    },
                    unit_amount: Math.floor(booking.amount),
                },
                quantity: 1,
            },
        ];
        //tạo phiên thanh toán stripe
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString(),
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // hết hạn sau 30 phút
        })
        booking.paymentLink = session.url;
        await booking.save();

        //Chạy chức năng lập lịch inngest để kiểm tra trạng thái thanh toán sau 10 phút.

        await inngest.send({
            name: "app/checkpayment",
            data: {
                bookingId: booking._id.toString(),
            },
        });

        res.json({ success: true, url: session.url });

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const showData = await Show.findById(showId);
        const occupiedSeats = Object.keys(showData.occupiedSeats);
        res.json({ success: true, occupiedSeats });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Hàm tính % hoàn tiền dựa trên thời gian
const calculateRefundPercentage = (showDateTime) => {
    const now = new Date();
    const showTime = new Date(showDateTime);
    const hoursUntilShow = (showTime - now) / (1000 * 60 * 60); // Convert to hours

    if (hoursUntilShow >= 24) {
        return 80; // Hoàn 80% nếu hủy trước 24h
    } else if (hoursUntilShow >= 12) {
        return 50; // Hoàn 50% nếu hủy trước 12-24h
    } else if (hoursUntilShow >= 6) {
        return 20; // Hoàn 20% nếu hủy trước 6-12h
    } else {
        return 0; // Không hoàn nếu hủy dưới 6h
    }
};

// API hủy vé
export const cancelBooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { bookingId } = req.params;

        // Tìm booking
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'show',
                populate: {
                    path: 'movie hall'
                }
            })
            .populate('user');

        if (!booking) {
            return res.json({ success: false, message: 'Không tìm thấy đặt vé' });
        }

        // Kiểm tra quyền sở hữu
        if (booking.user._id.toString() !== userId) {
            return res.json({ success: false, message: 'Bạn không có quyền hủy vé này' });
        }

        // Kiểm tra trạng thái
        if (booking.status === 'cancelled') {
            return res.json({ success: false, message: 'Vé này đã được hủy trước đó' });
        }

        // Kiểm tra thời gian
        const now = new Date();
        const showTime = new Date(booking.show.showDateTime);

        if (showTime <= now) {
            return res.json({ success: false, message: 'Không thể hủy vé sau khi suất chiếu đã bắt đầu' });
        }

        // Giải phóng ghế
        const showData = await Show.findById(booking.show._id);
        booking.bookedSeats.forEach(seat => {
            delete showData.occupiedSeats[seat];
        });
        showData.markModified('occupiedSeats');
        await showData.save();

        // Trường hợp 1: Vé CHƯA thanh toán - Xóa luôn, không gửi email
        if (!booking.ispaid) {
            await Booking.findByIdAndDelete(booking._id);
            return res.json({
                success: true,
                message: 'Hủy vé thành công'
            });
        }

        // Trường hợp 2: Vé ĐÃ thanh toán - Tính hoàn tiền, gửi email
        const refundPercentage = calculateRefundPercentage(booking.show.showDateTime);

        if (refundPercentage === 0) {
            // Hoàn lại ghế vì không được phép hủy
            booking.bookedSeats.forEach(seat => {
                showData.occupiedSeats[seat] = userId;
            });
            showData.markModified('occupiedSeats');
            await showData.save();

            return res.json({
                success: false,
                message: 'Không thể hủy vé trong vòng 6 giờ trước suất chiếu'
            });
        }

        const refundAmount = Math.floor((booking.amount * refundPercentage) / 100);

        // Để hoàn tiền thực sự, cần:
        // 1. Lưu paymentIntentId vào Booking model khi thanh toán thành công (stripeWebhooks.js)
        // 2. Gọi Stripe Refund API với paymentIntentId
        // 
        // LƯU Ý: Hiện tại đang dùng TEST MODE nên không thể hoàn tiền thực sự
        // Chỉ có thể hoàn tiền khi dùng PRODUCTION keys và có paymentIntentId
        //
        // ========================================

        // TODO: Uncomment code sau khi thêm paymentIntentId vào Booking model và chuyển sang PRODUCTION
        /*
        try {
            // Kiểm tra xem có paymentIntentId không (chỉ refund nếu đã thanh toán qua Stripe)
            if (booking.paymentIntentId) {
                const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
                
                // Tạo refund trên Stripe
                // API: https://stripe.com/docs/api/refunds/create
                const refund = await stripeInstance.refunds.create({
                    payment_intent: booking.paymentIntentId,  // PaymentIntent ID từ khi thanh toán
                    amount: refundAmount * 100,  // Stripe dùng cent, nên nhân 100 (VND: refundAmount * 100)
                    // metadata: {  // Optional: Thêm metadata để tracking
                    //     bookingId: booking._id.toString(),
                    //     refundPercentage: refundPercentage.toString()
                    // },
                    // reason: 'requested_by_customer'  // Lý do: user yêu cầu hủy
                });
                
                // Lưu refundId để tracking (optional - có thể thêm field refundId vào Booking model)
                // booking.refundId = refund.id;
                
                console.log(`✅ Stripe refund created: ${refund.id} - Amount: ${refundAmount} VNĐ`);
                
                // Lưu ý: Stripe sẽ tự động hoàn tiền về thẻ/card của user
                // Thời gian: Thường 5-10 ngày làm việc (tùy ngân hàng)
            } else {
                // Nếu không có paymentIntentId (thanh toán ngoại tuyến, hoặc test)
                console.log('⚠️ No paymentIntentId - Skip Stripe refund (test mode or offline payment)');
            }
        } catch (stripeError) {
            // Xử lý lỗi từ Stripe
            console.error('❌ Stripe refund error:', stripeError.message);
            
            // Nếu refund thất bại, có 2 options:
            // Option 1: Vẫn hủy booking nhưng không refund (chờ refund thủ công)
            // Option 2: Rollback và không hủy booking (báo lỗi cho user)
            // 
            // Tùy chọn: Nếu refund thất bại, bạn có thể:
            // - Log lỗi và thông báo cho admin
            // - Hoặc rollback: không hủy booking, return error
            // 
            // return res.json({ 
            //     success: false, 
            //     message: 'Không thể hoàn tiền. Vui lòng liên hệ hỗ trợ.' 
            // });
        }
        */

        // ========================================
        // END: HOÀN TIỀN THỰC SỰ
        // ========================================

        // Cập nhật booking
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.refundPercentage = refundPercentage;
        booking.refundAmount = refundAmount;
        await booking.save();

        // Trigger Inngest event để gửi email
        await inngest.send({
            name: "app/booking.cancelled",
            data: {
                bookingId: booking._id.toString(),
            },
        });

        res.json({
            success: true,
            message: `Hủy vé thành công. Bạn được hoàn ${refundPercentage}% (${refundAmount.toLocaleString('vi-VN')} ₫)`,
            refundPercentage,
            refundAmount
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.json({ success: false, message: error.message });
    }
};