import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: { type: String, required: true, ref: 'User' },
    show: { type: String, required: true, ref: 'Show' },
    amount: { type: Number, required: true },
    originalAmount: { type: Number }, // Giá gốc trước khi giảm
    promotionApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' }, // Khuyến mãi đã áp dụng
    discountAmount: { type: Number, default: 0 }, // Số tiền được giảm
    bookedSeats: { type: Array, required: true },
    ispaid: { type: Boolean, default: false },
    paymentLink: { type: String },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    cancelledAt: { type: Date },
    refundPercentage: { type: Number },
    refundAmount: { type: Number },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;