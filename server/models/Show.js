import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
    {
        movie:{type: String, required: true, ref: "Movie"},
        hall:{type: mongoose.Schema.Types.ObjectId, required: true, ref: "CinemaHall"},
        showDateTime:{type: Date, required: true},
        endDateTime:{type: Date, required: true},
        showPrice:{type: Number, required: true},
        occupiedSeats:{type: Object, default: {}},
        status:{
            type: String,
            enum: ['upcoming', 'active', 'completed', 'cancelled'],
            default: 'upcoming'
        },
    },
    {
        minimize: false,
    }
)

const Show = mongoose.model("Show", showSchema);
export default Show;