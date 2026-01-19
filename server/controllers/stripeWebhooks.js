import stripe from 'stripe';
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';

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

                // Trigger Inngest event để gửi email xác nhận đặt vé (đồng bộ với các tác vụ khác)
                await inngest.send({
                    name: "app/show.booked",
                    data: { bookingId }
                });

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