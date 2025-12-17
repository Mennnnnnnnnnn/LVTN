
import { Inngest } from "inngest";
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
                        <strong>Ngày:</strong>${new Date(booking.show.showDateTime).toLocaleDateString('en-US',{timeZone: 'Asia/Ho_Chi_Minh'})}<br/>
                        <strong>Thời gian:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US',{timeZone: 'Asia/Ho_Chi_Minh'})}
                    </p>
                    <p>Cảm ơn đã đặt vé cho chương trình!<br/>-Movie-Ticket-Booking</p>
                </div>`
        })

    }
)

export const functions = [syncUserCreation,syncUserDeletion,syncUserUpdation, releaseSeatAndDeleteBooking, sendBookingConfirmationEmail];