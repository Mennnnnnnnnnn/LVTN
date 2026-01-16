import stripe from 'stripe';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import sendEmail from '../configs/nodeMailer.js';
import QRCode from 'qrcode';
import { inngest } from '../inngest/index.js';

// Helper function to format VND
const vndFormat = (amount) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
};

// Hàm gửi email xác nhận đặt vé
const sendBookingConfirmationEmailDirect = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: [
                { path: 'movie', model: 'Movie' },
                { path: 'hall', model: 'CinemaHall' }
            ]
        }).populate('user').populate('promotionApplied');

        if (!booking) {
            console.error('Booking not found:', bookingId);
            return;
        }

        // Tạo QR code
        const qrData = JSON.stringify({
            bookingId: booking._id,
            userId: booking.user._id,
            showId: booking.show._id,
            seats: booking.bookedSeats
        });

        const qrCodeBuffer = await QRCode.toBuffer(qrData, {
            width: 250,
            margin: 2,
            type: 'png',
            color: { dark: '#000000', light: '#FFFFFF' }
        });
        const qrCodeBase64 = qrCodeBuffer.toString('base64');

        // Format date and time
        const showDate = new Date(booking.show.showDateTime).toLocaleDateString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const showTime = new Date(booking.show.showDateTime).toLocaleTimeString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Format seats
        const seatBadges = booking.bookedSeats.map(seat =>
            `<span style="display: inline-block; background: #F84565; color: white; padding: 6px 12px; margin: 4px; border-radius: 6px; font-weight: 600; font-size: 13px;">${seat}</span>`
        ).join('');

        // Tính giá gốc và khuyến mãi
        const originalAmount = booking.originalAmount || (booking.amount + (booking.discountAmount || 0));
        const discountAmount = booking.discountAmount || 0;
        const hasDiscount = booking.promotionApplied && discountAmount > 0;

        console.log('📧 Sending email with promotion info:', {
            bookingId: booking._id,
            originalAmount,
            discountAmount,
            finalAmount: booking.amount,
            hasDiscount,
            promotionName: booking.promotionApplied?.name || 'None'
        });

        // Tạo HTML cho khuyến mãi
        const discountHTML = hasDiscount ? `
            <tr>
                <td colspan="2" style="padding: 12px 0;">
                    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); border-radius: 10px; padding: 15px; text-align: center;">
                        <p style="margin: 0 0 5px 0; color: white; font-size: 13px;">🎉 KHUYẾN MÃI ĐÃ ÁP DỤNG</p>
                        <p style="margin: 0 0 8px 0; color: white; font-size: 16px; font-weight: 700;">${booking.promotionApplied.name}</p>
                        <p style="margin: 0; color: #ffe66d; font-size: 20px; font-weight: 700;">-${booking.promotionApplied.discountPercent}% (Tiết kiệm ${vndFormat(discountAmount)})</p>
                    </div>
                </td>
            </tr>
        ` : '';

        await sendEmail({
            to: booking.user.email,
            subject: `🎬 Xác nhận đặt vé - ${booking.show.movie.title}`,
            attachments: [{ name: 'qrcode.png', content: qrCodeBase64 }],
            body: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px;">
                    <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #F84565; margin: 0; font-size: 28px; font-weight: 700;">🎬 QUICKSHOW</h1>
                            <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">XÁC NHẬN ĐẶT VÉ THÀNH CÔNG</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                            <p style="margin: 0 0 10px 0; font-size: 15px; color: #666;">Xin chào <strong style="color: #333;">${booking.user.name}</strong>,</p>
                            <p style="margin: 0; font-size: 15px; color: #666;">Đặt vé của bạn đã được xác nhận thành công! ✅</p>
                        </div>

                        <!-- Movie Info -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565;">📽️ THÔNG TIN PHIM</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Tên phim:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${booking.show.movie.title}</td></tr>
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Ngày chiếu:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${showDate}</td></tr>
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Giờ chiếu:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${showTime}</td></tr>
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Phòng chiếu:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;"><span style="background: #F84565; color: white; padding: 4px 10px; border-radius: 5px; font-size: 13px;">${booking.show.hall?.name || 'N/A'}</span></td></tr>
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Thời lượng:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${booking.show.movie.runtime} phút</td></tr>
                            </table>
                        </div>

                        <!-- Booking Details -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565;">🎫 CHI TIẾT ĐẶT VÉ</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Mã đặt vé:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right; font-family: monospace;">#${booking._id.toString().slice(-8).toUpperCase()}</td></tr>
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Số lượng ghế:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${booking.bookedSeats.length} ghế</td></tr>
                            </table>
                            <div style="margin-top: 15px;">
                                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Ghế đã chọn:</p>
                                <div style="text-align: center;">${seatBadges}</div>
                            </div>
                        </div>

                        <!-- Payment Info -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565;">💰 THÔNG TIN THANH TOÁN</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Số ghế:</td><td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${booking.bookedSeats.length} ghế</td></tr>
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Tạm tính:</td><td style="padding: 8px 0; color: ${hasDiscount ? '#999' : '#333'}; font-weight: 600; font-size: 14px; text-align: right;${hasDiscount ? ' text-decoration: line-through;' : ''}">${vndFormat(originalAmount)}</td></tr>
                                ${discountHTML}
                                <tr style="border-top: 2px solid #e9ecef;"><td style="padding: 12px 0; color: #333; font-size: 16px; font-weight: 700;">Tổng thanh toán:</td><td style="padding: 12px 0; color: #F84565; font-weight: 700; font-size: 20px; text-align: right;">${vndFormat(booking.amount)}</td></tr>
                                <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Trạng thái:</td><td style="padding: 8px 0; text-align: right;"><span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">✓ ĐÃ THANH TOÁN</span></td></tr>
                            </table>
                        </div>

                        <!-- QR Code Info -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565; text-align: center;">📱 MÃ QR CHECK-IN</h2>
                            <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; border-radius: 5px; text-align: center;">
                                <p style="margin: 0 0 10px 0; color: #1976D2; font-size: 16px; font-weight: 600;">📎 Mã QR đính kèm trong email</p>
                                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">Vui lòng xem file đính kèm <strong>"qrcode.png"</strong> bên dưới<br/>và xuất trình mã QR này tại quầy khi đến rạp</p>
                            </div>
                        </div>

                        <!-- Important Notes -->
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">⚠️ LƯU Ý QUAN TRỌNG</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.8;">
                                <li>Vui lòng đến rạp trước <strong>15 phút</strong></li>
                                <li>Mang theo email này hoặc mã QR</li>
                                <li>Mã QR chỉ sử dụng được <strong>một lần</strong></li>
                                <li>Không chia sẻ mã QR với người khác</li>
                            </ul>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
                            <p style="margin: 0; color: #999; font-size: 12px;">Trân trọng,<br/><strong style="color: #F84565;">Đội ngũ QuickShow</strong></p>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 20px; color: white; font-size: 12px;">
                        <p style="margin: 0;">© 2024 QuickShow. All rights reserved.</p>
                    </div>
                </div>
            `
        });

        console.log('✅ Email sent successfully to:', booking.user.email);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
};

export const stripeWebhooks = async (request, response) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                })

                const session = sessionList.data[0];
                const { bookingId } = session.metadata;

                // ========================================
                // 💰 LƯU PAYMENTINTENTID ĐỂ REFUND SAU NÀY
                // ========================================
                // 
                // Cần lưu paymentIntentId vào Booking để có thể refund khi hủy vé
                // Lưu ý: Cần thêm field paymentIntentId vào Booking model trước
                //
                // ========================================
                // TODO: Uncomment sau khi thêm paymentIntentId vào Booking model
                /*
                await Booking.findByIdAndUpdate(bookingId, {
                    ispaid: true,
                    paymentLink: "",
                    paymentIntentId: paymentIntent.id  // ← Lưu PaymentIntent ID để refund sau này
                })
                */

                // Code hiện tại (chưa lưu paymentIntentId):
                await Booking.findByIdAndUpdate(bookingId, {
                    ispaid: true,
                    paymentLink: ""
                })

                // Gửi email xác nhận đặt vé trực tiếp (không qua Inngest)
                await sendBookingConfirmationEmailDirect(bookingId);

                break;
            }
            default:
                console.log('Unhandled event type', event.type);
        }
        response.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        response.status(500).send('Internal Server Error');
    }
}