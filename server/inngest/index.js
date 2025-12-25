
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
            populate: {path: 'movie', model: 'Movie'}
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
                    content: qrCodeBase64,
                    contentId: 'qrcode'
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

                        <!-- QR Code -->
                        <div style="margin-bottom: 25px; text-align: center;">
                            <h2 style="color: #333; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #F84565;">
                                📱 MÃ QR CHECK-IN
                            </h2>
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; display: inline-block;">
                                <img src="cid:qrcode" alt="QR Code" style="width: 250px; height: 250px; display: block;" />
                            </div>
                            <p style="margin: 15px 0 0 0; color: #666; font-size: 13px;">Vui lòng xuất trình mã QR này tại quầy khi đến rạp</p>
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
    {cron: "0 */8 * * *"}, // chạy mỗi 8h
    async ({step}) => {
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);// 8h sau

        //chuẩn bị nhiệm vụ nhắc nhở
        const remindersTasks = await step.run("perpare-reminder-tasks", async () => {
            const shows = await Show.find({
                showTime: {$gte: windowStart, $lt: in8Hours},
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
                        showTime: show.showTime,
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
                            ${new Date(task.showTime).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </strong>
                            lúc
                            <strong>
                            ${new Date(task.showTime).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </strong>.
                        </p>

                        <p>
                            Phim sẽ bắt đầu trong khoảng <strong>8 tiếng nữa</strong>,
                            hãy chắc chắn bạn đã sẵn sàng!
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
    async ({event}) => {
        const {movieTitle} = event.data;

        const users = await User.find({})

        for(const user of users){
            const userEmail = user.email;
            const userName = user.name;

            const subject = `🎬 Phim mới được thêm: ${movieTitle}`;
            const body = `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Xin chào ${userName},</h2>

                        <p>Chúng tôi vừa thêm một bộ phim mới vào thư viện:</p>

                        <h3 style="color: #F84565;">${movieTitle}</h3>

                        <p>Hãy truy cập website của chúng tôi để xem chi tiết.</p>

                        <br/>

                        <p>
                            Trân trọng,<br/>
                            Đội ngũ QuickShow
                        </p>
                        </div>
            `;

            await sendEmail({
                to: userEmail,
                subject,
                body
            })
        }

        return {message: "Đã gửi thông báo."}
    }
)

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation, 
    releaseSeatAndDeleteBooking, 
    sendBookingConfirmationEmail, 
    sendShowReminders,
    sendNewShowNotifications
];