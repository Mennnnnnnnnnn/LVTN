
import { Inngest, step } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";
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
        // inngest gửi email
        await sendEmail({
            to:booking.user.email,
            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
            body:`
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Chào ${booking.user.name},</h2>
                    <p>Đặt chỗ của bạn cho <strong style="color: #F84565;">${booking.show.movie.title}></strong> thanh cong!</p>
                    <p>
                        <strong>Ngày:</strong>${new Date(booking.show.showDateTime).toLocaleDateString('vi-VN',{timeZone: 'Asia/Ho_Chi_Minh'})}<br/>
                        <strong>Thời gian:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('vi-VN',{timeZone: 'Asia/Ho_Chi_Minh'})}
                    </p>
                    <p>Cảm ơn đã đặt vé cho chương trình!<br/>-Movie-Ticket-Booking</p>
                </div>`
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