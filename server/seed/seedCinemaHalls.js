import mongoose from 'mongoose';
import CinemaHall from '../models/CinemaHall.js';
import 'dotenv/config';

const cinemaHalls = [
    {
        name: "Phòng 1 - Standard",
        hallNumber: 1,
        type: "Standard",
        totalSeats: 90,
        seatLayout: {
            rows: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            seatsPerRow: 9,
            coupleSeatsRows: ["H", "J"] // Dãy H và J là ghế đôi (bỏ I)
        },
        customRowSeats: {},
        priceMultiplier: 1,
        status: "active"
    },
    {
        name: "Phòng 2 - Standard",
        hallNumber: 2,
        type: "Standard",
        totalSeats: 90,
        seatLayout: {
            rows: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            seatsPerRow: 9,
            coupleSeatsRows: ["H", "J"] // Dãy H và J là ghế đôi (bỏ I)
        },
        customRowSeats: {},
        priceMultiplier: 1,
        status: "active"
    },
    {
        name: "Phòng 3 - VIP",
        hallNumber: 3,
        type: "VIP",
        totalSeats: 60,
        seatLayout: {
            rows: ["A", "B", "C", "D", "E", "F"],
            seatsPerRow: 10,
            coupleSeatsRows: ["D", "F"] // Dãy D và F là ghế đôi (bỏ E)
        },
        customRowSeats: {},
        priceMultiplier: 1.5,
        status: "active"
    },
    {
        name: "Phòng 4 - IMAX",
        hallNumber: 4,
        type: "IMAX",
        totalSeats: 100, // 10 dãy x 10 ghế = 100
        seatLayout: {
            rows: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            seatsPerRow: 10,
            coupleSeatsRows: ["H", "J"] // Dãy H và J là ghế đôi (bỏ I)
        },
        customRowSeats: {},
        priceMultiplier: 2,
        status: "active"
    },
    {
        name: "Phòng 5 - Standard",
        hallNumber: 5,
        type: "Standard",
        totalSeats: 90,
        seatLayout: {
            rows: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
            seatsPerRow: 9,
            coupleSeatsRows: ["H", "J"] // Dãy H và J là ghế đôi (bỏ I)
        },
        customRowSeats: {},
        priceMultiplier: 1,
        status: "active"
    }
];

const seedCinemaHalls = async () => {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb+srv://luanvantotnghiep:luanvantotnghiep123@cluster0.22gk0n6.mongodb.net';
        await mongoose.connect(uri + '/luanvantotnghiep');
        console.log('✅ Connected to MongoDB (database: luanvantotnghiep)');

        // Clear existing halls
        await CinemaHall.deleteMany({});
        console.log('🗑️  Cleared existing cinema halls');

        // Insert new halls
        const result = await CinemaHall.insertMany(cinemaHalls);
        console.log(`✅ Successfully created ${result.length} cinema halls:`);
        
        result.forEach(hall => {
            console.log(`   - ${hall.name} (${hall.type}) - ${hall.totalSeats} seats`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding cinema halls:', error);
        process.exit(1);
    }
};

seedCinemaHalls();

