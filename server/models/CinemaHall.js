import mongoose from "mongoose";

const cinemaHallSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        hallNumber: { type: Number, required: true, unique: true },
        type: { type: String, required: true }, // Standard, VIP, IMAX
        totalSeats: { type: Number, required: true },
        seatLayout: {
            rows: { type: [String], required: true }, // ["A", "B", "C", ...]
            seatsPerRow: { type: Number, required: true },
            coupleSeatsRows: { type: [String], default: [] }, // Dãy có ghế đôi: ["L"]
            layoutType: { type: String, default: 'default' } // 'default', 'single-column', 'two-columns', 'theater-v'
        },
        customRowSeats: { type: Object, default: {} }, // Số ghế tùy chỉnh theo dãy: { "L": 6 }
        priceMultiplier: { type: Number, default: 1 }, // VIP: 1.5, IMAX: 2
        status: { type: String, default: 'active' }, // active, maintenance
        brokenSeats: { type: [String], default: [] }, // Ghế hỏng: ["A1", "B5", "C10"]
        maintenanceNote: { type: String, default: '' }, // Ghi chú bảo trì
        maintenanceStartDate: { type: Date }, // Ngày bắt đầu bảo trì
        maintenanceEndDate: { type: Date } // Ngày kết thúc bảo trì dự kiến
    },
    {
        timestamps: true,
    }
);

const CinemaHall = mongoose.model("CinemaHall", cinemaHallSchema);

export default CinemaHall;

