import CinemaHall from '../models/CinemaHall.js';
import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import mongoose from 'mongoose';

// API to get all cinema halls (with optional filters)
export const getAllHalls = async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (type) filter.type = type;
        
        const halls = await CinemaHall.find(filter).sort({ hallNumber: 1 });
        res.json({ success: true, halls });
    } catch (error) {
        console.error('Error fetching cinema halls:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to get a single hall by ID
export const getHallById = async (req, res) => {
    try {
        const { hallId } = req.params;
        const hall = await CinemaHall.findById(hallId);
        
        if (!hall) {
            return res.json({ success: false, message: 'Không tìm thấy phòng chiếu' });
        }
        
        res.json({ success: true, hall });
    } catch (error) {
        console.error('Error fetching hall:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to create a new cinema hall
export const createHall = async (req, res) => {
    try {
        const {
            name,
            hallNumber,
            type,
            totalSeats,
            seatLayout,
            customRowSeats,
            priceMultiplier,
            status,
            brokenSeats
        } = req.body;

        // Check if hall number already exists
        const existingHall = await CinemaHall.findOne({ hallNumber });
        if (existingHall) {
            return res.json({ success: false, message: 'Số phòng chiếu đã tồn tại' });
        }

        const newHall = new CinemaHall({
            name,
            hallNumber,
            type,
            totalSeats,
            seatLayout,
            customRowSeats: customRowSeats || {},
            priceMultiplier: priceMultiplier || 1,
            status: status || 'active',
            brokenSeats: brokenSeats || []
        });

        await newHall.save();
        res.json({ success: true, message: 'Tạo phòng chiếu thành công', hall: newHall });
    } catch (error) {
        console.error('Error creating cinema hall:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to update a cinema hall
export const updateHall = async (req, res) => {
    try {
        const { hallId } = req.params;
        const updates = req.body;

        // If updating hall number, check if it's already taken
        if (updates.hallNumber) {
            const existingHall = await CinemaHall.findOne({ 
                hallNumber: updates.hallNumber,
                _id: { $ne: hallId }
            });
            if (existingHall) {
                return res.json({ success: false, message: 'Số phòng chiếu đã tồn tại' });
            }
        }

        const updatedHall = await CinemaHall.findByIdAndUpdate(
            hallId,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedHall) {
            return res.json({ success: false, message: 'Không tìm thấy phòng chiếu' });
        }

        res.json({ success: true, message: 'Cập nhật phòng chiếu thành công', hall: updatedHall });
    } catch (error) {
        console.error('Error updating cinema hall:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to delete/disable a cinema hall
export const deleteHall = async (req, res) => {
    try {
        const { hallId } = req.params;
        
        // Check if hall has any future shows
        const futureShows = await Show.countDocuments({
            hall: hallId,
            showDateTime: { $gte: new Date() }
        });

        if (futureShows > 0) {
            return res.json({ 
                success: false, 
                message: `Không thể xóa phòng chiếu. Có ${futureShows} suất chiếu đã lên lịch. Vui lòng chuyển sang chế độ bảo trì thay thế.` 
            });
        }

        // Soft delete by setting status to inactive
        const updatedHall = await CinemaHall.findByIdAndUpdate(
            hallId,
            { status: 'inactive' },
            { new: true }
        );

        if (!updatedHall) {
            return res.json({ success: false, message: 'Không tìm thấy phòng chiếu' });
        }

        res.json({ success: true, message: 'Vô hiệu hóa phòng chiếu thành công' });
    } catch (error) {
        console.error('Error deleting cinema hall:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to toggle hall status (active/maintenance)
export const toggleHallStatus = async (req, res) => {
    try {
        const { hallId } = req.params;
        const { status, maintenanceNote, maintenanceStartDate, maintenanceEndDate } = req.body;

        const updates = { status };
        
        if (status === 'maintenance') {
            updates.maintenanceNote = maintenanceNote || '';
            updates.maintenanceStartDate = maintenanceStartDate || new Date();
            updates.maintenanceEndDate = maintenanceEndDate;
        }

        const updatedHall = await CinemaHall.findByIdAndUpdate(
            hallId,
            updates,
            { new: true }
        );

        if (!updatedHall) {
            return res.json({ success: false, message: 'Không tìm thấy phòng chiếu' });
        }

        res.json({ success: true, message: 'Cập nhật trạng thái phòng chiếu thành công', hall: updatedHall });
    } catch (error) {
        console.error('Error updating hall status:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to get cinema hall statistics
export const getHallStatistics = async (req, res) => {
    try {
        const { hallId } = req.params;
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.$gte = new Date(startDate);
            if (endDate) dateFilter.date.$lte = new Date(endDate);
        }

        // Get all shows for this hall (field name is 'hall' not 'cinemaHall')
        const shows = await Show.find({ 
            hall: hallId,
            ...dateFilter
        }).populate('movie');

        // Calculate statistics
        const totalShows = shows.length;
        let totalRevenue = 0;
        let totalSeatsBooked = 0;
        let totalSeatsAvailable = 0;

        for (const show of shows) {
            // Get bookings for this show (only paid bookings)
            const bookings = await Booking.find({ 
                show: show._id.toString(),
                ispaid: true
            });

            bookings.forEach(booking => {
                totalRevenue += booking.amount;
                totalSeatsBooked += booking.bookedSeats.length;
            });

            totalSeatsAvailable += show.totalSeats;
        }

        const occupancyRate = totalSeatsAvailable > 0 
            ? ((totalSeatsBooked / totalSeatsAvailable) * 100).toFixed(2)
            : 0;

        const avgRevenuePerShow = totalShows > 0 
            ? (totalRevenue / totalShows).toFixed(2)
            : 0;

        res.json({
            success: true,
            statistics: {
                totalShows,
                totalRevenue,
                totalSeatsBooked,
                totalSeatsAvailable,
                occupancyRate: parseFloat(occupancyRate),
                avgRevenuePerShow: parseFloat(avgRevenuePerShow)
            }
        });
    } catch (error) {
        console.error('Error fetching hall statistics:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all halls statistics (summary)
export const getAllHallsStatistics = async (req, res) => {
    try {
        const halls = await CinemaHall.find({ status: { $ne: 'inactive' } });
        
        const statisticsPromises = halls.map(async (hall) => {
            const shows = await Show.find({ hall: hall._id });
            const totalShows = shows.length;
            
            let totalRevenue = 0;
            let totalSeatsBooked = 0;
            
            for (const show of shows) {
                const bookings = await Booking.find({ 
                    show: show._id.toString(),
                    ispaid: true
                });
                
                bookings.forEach(booking => {
                    totalRevenue += booking.amount;
                    totalSeatsBooked += booking.bookedSeats.length;
                });
            }
            
            return {
                hallId: hall._id,
                hallName: hall.name,
                hallNumber: hall.hallNumber,
                type: hall.type,
                status: hall.status,
                totalShows,
                totalRevenue,
                totalSeatsBooked
            };
        });

        const statistics = await Promise.all(statisticsPromises);

        res.json({ success: true, statistics });
    } catch (error) {
        console.error('Error fetching all halls statistics:', error);
        res.json({ success: false, message: error.message });
    }
};

