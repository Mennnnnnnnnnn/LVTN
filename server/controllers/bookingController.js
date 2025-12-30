
import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
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

export const createBooking = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {showId, selectedSeats} = req.body;
        const {origin} = req.headers;
        //kiểm tra xem chỗ ngồi có sẵn cho chương trình đã chọn không
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

        if(!isAvailable){
            return res.json({success: false, message: 'Một hoặc nhiều ghế đã chọn đã được đặt. Vui lòng chọn ghế khác.'});
        }
        // Get the show details
        const showData = await Show.findById(showId).populate('movie').populate('hall');
        
        // ✅ Check if hall is active
        if(!showData.hall || showData.hall.status !== 'active'){
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
            if(showData.hall.seatLayout?.coupleSeatsRows?.includes(row)) {
                seatPrice += COUPLE_SEAT_SURCHARGE;
            }
            
            // Phụ thu suất tối
            if(isEveningShow) {
                seatPrice += EVENING_SURCHARGE;
            }
            
            totalAmount += seatPrice;
        });
        
        //create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: totalAmount,
            bookedSeats: selectedSeats
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
            {price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: showData.movie.title},
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

        res.json({success: true, url: session.url});

    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}

export const getOccupiedSeats = async (req, res) => {
    try {
        const {showId} = req.params;
        const showData = await Show.findById(showId);
        const occupiedSeats = Object.keys(showData.occupiedSeats);
        res.json({success: true, occupiedSeats});
    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
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