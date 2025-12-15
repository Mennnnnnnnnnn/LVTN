
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
            return res.json({success: false, message: 'One or more selected seats are already booked. Please choose different seats.'});
        }
        // Get the show details
        const showData = await Show.findById(showId).populate('movie');
        //create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
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
                    currency: 'usd',
                    product_data: {
                        name: showData.movie.title},
                    unit_amount: Math.floor(booking.amount)*100,
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