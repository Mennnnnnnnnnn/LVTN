
import { Inngest, step } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";
import QRCode from 'qrcode';

// Helper function to format VND
const vndFormat = (amount) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "movie-ticket-booking", 
    signingKey: process.env.INNGEST_SIGNING_KEY
});

//Inngest Functions to save user data to a database
const syncUserCreation = inngest.createFunction(
    { id:'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        try {
            const {id, first_name, last_name, email_addresses, image_url} = event.data;
            const userData = {
                _id: id,
                name:first_name + ' ' + last_name,
                email: email_addresses[0]?.email_address,
                image: image_url
            };
            await User.create(userData);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
)
//Inngest Functions to delete user from a database
const syncUserDeletion = inngest.createFunction(
    { id:'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        try {
            const {id} = event.data;
            await User.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
)
//Inngest Functions to update user in a database
const syncUserUpdation = inngest.createFunction(
    { id:'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        try {
            const {id, first_name, last_name, email_addresses, image_url} = event.data;
            const userData = {
                _id: id,
                name:first_name + ' ' + last_name,
                email: email_addresses[0]?.email_address,
                image: image_url
            };
            await User.findByIdAndUpdate(id, userData);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
)
//Chức năng hủy đặt chỗ và giải phóng chỗ ngồi xem chương trình
// sau 10 phút kể từ khi đặt chỗ được tạo nếu thanh toán không được thực hiện.

const releaseSeatAndDeleteBooking = inngest.createFunction(
    { id:'release-seats-delete-booking'},
    { event: "app/checkpayment"},
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

        await step.run("check-payment-status", async () => {
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId);
            // nếu thanh toán chưa được thực hiện, hủy đặt chỗ và giải phóng chỗ ngồi
            if(!booking.ispaid){
                const show = await Show.findById(booking.show);
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat];
                });
                show.markModified('occupiedSeats');
                await show.save();
                await Booking.findByIdAndDelete(booking._id);
            }
        })
    }
)

// hàm inngest gửi email khi người dùng đặt vé thành công
const sendBookingConfirmationEmail = inngest.createFunction(
    { id:'send-booking-confirmation-email'},
    { event: "app/show.booked"},
    async ({ event, step }) => {
        const {bookingId} = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: [
                {path: 'movie', model: 'Movie'},
                {path: 'hall', model: 'CinemaHall'}
            ]
        }).populate('user');
        
        // Tạo QR code chứa thông tin booking
        const qrData = JSON.stringify({
            bookingId: booking._id,
            userId: booking.user._id,
            showId: booking.show._id,
            seats: booking.bookedSeats
        });
        
        // Generate QR code as buffer, then convert to base64
        const qrCodeBuffer = await QRCode.toBuffer(qrData, {
            width: 250,
            margin: 2,
            type: 'png',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        // Convert buffer to base64 string (without data URI prefix)
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

        // Format seats as badges
        const seatBadges = booking.bookedSeats.map(seat => 
            `<span style="display: inline-block; background: #F84565; color: white; padding: 6px 12px; margin: 4px; border-radius: 6px; font-weight: 600; font-size: 13px;">${seat}</span>`
        ).join('');

        const pricePerSeat = booking.amount / booking.bookedSeats.length;

        // inngest gửi email với QR code attachment
        await sendEmail({
            to: booking.user.email,
            subject: `🎬 Xác nhận đặt vé - ${booking.show.movie.title}`,
            attachments: [
                {
                    name: 'qrcode.png',
                    content: qrCodeBase64
                }
            ],
            body: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px;">
                    <!-- Header -->
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
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565;">
                                📽️ THÔNG TIN PHIM
                            </h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Tên phim:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${booking.show.movie.title}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Ngày chiếu:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${showDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Giờ chiếu:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${showTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Phòng chiếu:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">
                                        <span style="background: #F84565; color: white; padding: 4px 10px; border-radius: 5px; font-size: 13px;">${booking.show.hall?.name || 'N/A'}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Thời lượng:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${booking.show.movie.runtime} phút</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Booking Details -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565;">
                                🎫 CHI TIẾT ĐẶT VÉ
                            </h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Mã đặt vé:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right; font-family: monospace;">#${booking._id.toString().slice(-8).toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Số lượng ghế:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${booking.bookedSeats.length} ghế</td>
                                </tr>
                            </table>
                            <div style="margin-top: 15px;">
                                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Ghế đã chọn:</p>
                                <div style="text-align: center;">
                                    ${seatBadges}
                                </div>
                            </div>
                        </div>

                        <!-- Payment Info -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565;">
                                💰 THÔNG TIN THANH TOÁN
                            </h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Giá vé:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: 600; font-size: 14px; text-align: right;">${vndFormat(pricePerSeat)} × ${booking.bookedSeats.length}</td>
                                </tr>
                                <tr style="border-top: 2px solid #e9ecef;">
                                    <td style="padding: 12px 0; color: #333; font-size: 16px; font-weight: 700;">Tổng cộng:</td>
                                    <td style="padding: 12px 0; color: #F84565; font-weight: 700; font-size: 20px; text-align: right;">${vndFormat(booking.amount)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Trạng thái:</td>
                                    <td style="padding: 8px 0; text-align: right;">
                                        <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">✓ ĐÃ THANH TOÁN</span>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- QR Code Info -->
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565; text-align: center;">
                                📱 MÃ QR CHECK-IN
                            </h2>
                            <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; border-radius: 5px; text-align: center;">
                                <p style="margin: 0 0 10px 0; color: #1976D2; font-size: 16px; font-weight: 600;">
                                    📎 Mã QR đính kèm trong email
                                </p>
                                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                                    Vui lòng xem file đính kèm <strong>"qrcode.png"</strong> bên dưới<br/>
                                    và xuất trình mã QR này tại quầy khi đến rạp
                                </p>
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
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                Trân trọng,<br/>
                                <strong style="color: #F84565;">Đội ngũ QuickShow</strong>
                            </p>
                        </div>
                    </div>
                    
                    <!-- Outer Footer -->
                    <div style="text-align: center; padding: 20px; color: white; font-size: 12px;">
                        <p style="margin: 0;">© 2024 QuickShow. All rights reserved.</p>
                    </div>
                </div>
            `
        })

    }
)

//Inngest Functions để gửi lời nhắc

const sendShowReminders = inngest.createFunction(
    { id:'send-show-reminders'},
    {cron: "0 */1 * * *"}, // chạy mỗi 1h để không miss reminder
    async ({step}) => {
        const now = new Date();
        const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);// 3h sau

        //chuẩn bị nhiệm vụ nhắc nhở
        const remindersTasks = await step.run("prepare-reminder-tasks", async () => {
            const shows = await Show.find({
                showDateTime: {$gte: now, $lt: in3Hours},
            }).populate('movie');

            const tasks = [];
            
            for(const show of shows){
                if(!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new Set(Object.values(show.occupiedSeats))];
                if(userIds.length === 0) continue;

                const users = await User.find({_id: {$in: userIds}}).select('name email');

                for(const user of users){
                    tasks.push({
                        userEmail: user.email,
                        userName: user.name,
                        movieTitle: show.movie.title,
                        showDateTime: show.showDateTime,
                    })
                }
            }
            return tasks;
        });

        if(remindersTasks.length === 0){
            return {sent: 0, message:"không có lời nhắc nào để gửi"}
        }
        
        //gửi email nhắc nhở

        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                 remindersTasks.map(task => sendEmail({
                     to: task.userEmail,
                     subject:`Nhắc nhở: Phim "${task.movieTitle}" sắp bắt đầu chiếu!`,
                     body: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Xin chào ${task.userName},</h2>

                        <p>Đây là email nhắc nhở nhanh rằng bộ phim của bạn:</p>

                        <h3 style="color: #F84565;">${task.movieTitle}</h3>

                        <p>
                            được lên lịch chiếu vào ngày
                            <strong>
                            ${new Date(task.showDateTime).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </strong>
                            lúc
                            <strong>
                            ${new Date(task.showDateTime).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </strong>.
                        </p>

                        <p>
                            Phim sẽ bắt đầu trong khoảng <strong>3 tiếng nữa</strong>,
                            hãy chắc chắn bạn đã sẵn sàng và đến rạp đúng giờ!
                        </p>

                        <br/>

                        <p>Chúc bạn xem phim vui vẻ!<br/>Đội ngũ QuickShow</p>
                        </div>
                        `
                 }))
            )
        })

        const sent = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.length - sent;
        return {
            sent,
            failed,
            message: `Đã gửi ${sent} lời nhắc,${failed} gửi thất bại.`
        };
    }
)

//Hàm Inngest dùng để gửi thông báo khi có chương trình mới được thêm vào.

const sendNewShowNotifications = inngest.createFunction(
    {id: "send-new-show-notifications"},
    {event: "app/show.added"},
    async ({event, step}) => {
        const {movieTitle, movieId} = event.data;

        // Lấy thông tin chi tiết phim để email đẹp hơn
        const movie = await step.run('get-movie-details', async () => {
            const Movie = (await import('../models/Movie.js')).default;
            return await Movie.findById(movieId);
        });

        if (!movie) {
            console.log('Movie not found, skip notification');
            return {message: "Movie not found"};
        }

        const users = await User.find({});

        // Gửi email theo batch để tránh quá tải
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            await step.run(`send-batch-${i}`, async () => {
                const batch = users.slice(i, i + batchSize);
                
                const promises = batch.map(user => {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const movieUrl = `${frontendUrl}/movies/${movie._id}`;
                    
                    return sendEmail({
                        to: user.email,
                        subject: `🎬 Phim mới: ${movie.title}`,
                        body: `
                            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px;">
                                <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <!-- Header -->
                                    <div style="text-align: center; margin-bottom: 25px;">
                                        <h1 style="color: #F84565; margin: 0; font-size: 28px; font-weight: 700;">🎬 QUICKSHOW</h1>
                                        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">PHIM MỚI VỪA RA MẮT!</p>
                                    </div>
                                    
                                    <!-- Greeting -->
                                    <div style="margin-bottom: 20px;">
                                        <p style="margin: 0; font-size: 15px; color: #666;">Xin chào <strong style="color: #333;">${user.name}</strong>,</p>
                                        <p style="margin: 10px 0 0 0; font-size: 15px; color: #666;">Chúng tôi rất vui mừng thông báo một bộ phim mới đã có mặt tại rạp! 🎉</p>
                                    </div>

                                    <!-- Movie Info -->
                                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                                        <h2 style="color: #F84565; margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">${movie.title}</h2>
                                        
                                        ${movie.tagline ? `<p style="margin: 0 0 15px 0; font-style: italic; color: #666; font-size: 14px;">"${movie.tagline}"</p>` : ''}
                                        
                                        <p style="margin: 0 0 10px 0; color: #444; font-size: 14px; line-height: 1.6;">${movie.overview ? movie.overview.substring(0, 200) + (movie.overview.length > 200 ? '...' : '') : ''}</p>
                                        
                                        <div style="margin-top: 15px;">
                                            <p style="margin: 5px 0; color: #666; font-size: 13px;">
                                                <strong>🎭 Thể loại:</strong> ${movie.genres?.map(g => g.name).join(", ") || 'N/A'}
                                            </p>
                                            <p style="margin: 5px 0; color: #666; font-size: 13px;">
                                                <strong>⏱️ Thời lượng:</strong> ${movie.runtime} phút
                                            </p>
                                            <p style="margin: 5px 0; color: #666; font-size: 13px;">
                                                <strong>⭐ Đánh giá:</strong> ${movie.vote_average?.toFixed(1)}/10
                                            </p>
                                        </div>
                                    </div>

                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 25px 0;">
                                        <a href="${movieUrl}" 
                                           style="display: inline-block; background: #F84565; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(248, 69, 101, 0.3);">
                                            🎫 ĐặT VÉ NGAY
                                        </a>
                                    </div>

                                    <!-- Footer -->
                                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef;">
                                        <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Đừng bỏ lỡ cơ hội trải nghiệm!</p>
                                        <p style="margin: 0; color: #999; font-size: 12px;">
                                            Trân trọng,<br/>
                                            <strong style="color: #F84565;">Đội ngũ QuickShow</strong>
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Outer Footer -->
                                <div style="text-align: center; padding: 20px; color: white; font-size: 12px;">
                                    <p style="margin: 0;">© 2024 QuickShow. All rights reserved.</p>
                                </div>
                            </div>
                        `
                    });
                });

                await Promise.allSettled(promises);
            });
        }

        return {message: `Đã gửi thông báo phim "${movieTitle}" cho ${users.length} người dùng.`}
    }
)

// Inngest function gửi email xác nhận hủy vé
const sendCancellationEmail = inngest.createFunction(
    { id:'send-cancellation-email'},
    { event: "app/booking.cancelled"},
    async ({ event, step }) => {
        const { bookingId } = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: [
                {path: 'movie', model: 'Movie'},
                {path: 'hall', model: 'CinemaHall'}
            ]
        }).populate('user');

        if (!booking) {
            console.log('Booking not found');
            return { message: 'Booking not found' };
        }

        const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
                    .refund-box { background: #e8f5e9; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
                    .refund-amount { font-size: 32px; font-weight: bold; color: #2e7d32; margin: 10px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎬 Hủy vé thành công</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${booking.user.name}</strong>,</p>
                        <p>Vé đặt của bạn đã được hủy thành công.</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0; color: #667eea;">📋 Thông tin vé đã hủy</h3>
                            <p><strong>Phim:</strong> ${booking.show.movie.title}</p>
                            <p><strong>Phòng chiếu:</strong> ${booking.show.hall?.name || 'N/A'}</p>
                            <p><strong>Suất chiếu:</strong> ${new Date(booking.show.showDateTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
                            <p><strong>Ghế đã đặt:</strong> ${booking.bookedSeats.join(', ')}</p>
                            <p><strong>Số tiền đã thanh toán:</strong> ${vndFormat(booking.amount)}</p>
                        </div>

                        <div class="refund-box">
                            <h3 style="margin-top: 0; color: #2e7d32;">💰 Thông tin hoàn tiền</h3>
                            <p>Bạn được hoàn:</p>
                            <div class="refund-amount">${vndFormat(booking.refundAmount)}</div>
                            <p style="font-size: 18px; color: #666;">(${booking.refundPercentage}% giá trị vé)</p>
                            <p style="font-size: 14px; color: #666; margin-top: 15px;">
                                ${booking.ispaid 
                                    ? '💳 Số tiền sẽ được hoàn lại vào tài khoản của bạn trễ nhất trong vòng 3 ngày làm việc.'
                                    : '✅ Vé chưa thanh toán nên không có giao dịch hoàn tiền.'
                                }
                            </p>
                        </div>

                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>📌 Chính sách hoàn vé:</strong>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Hủy trước 24h: Hoàn 80%</li>
                                <li>Hủy trước 12-24h: Hoàn 50%</li>
                                <li>Hủy trước 6-12h: Hoàn 20%</li>
                                <li>Dưới 6h: Không hoàn</li>
                            </ul>
                        </div>

                        <p style="margin-top: 30px;">Cảm ơn bạn đã sử dụng dịch vụ QuickShow. Hẹn gặp lại bạn!</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/movies" class="button">
                                Xem phim khác
                            </a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} QuickShow. Bảo lưu mọi quyền.</p>
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail({
            to: booking.user.email,
            subject: `🎫 Hủy vé thành công - Hoàn ${booking.refundPercentage}% (${vndFormat(booking.refundAmount)})`,
            body: emailBody
        });

        return { message: 'Cancellation email sent successfully' };
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation, 
    releaseSeatAndDeleteBooking, 
    sendBookingConfirmationEmail, 
    sendShowReminders,
    sendNewShowNotifications,
    sendCancellationEmail
];