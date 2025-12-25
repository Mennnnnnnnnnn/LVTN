import CinemaHall from '../models/CinemaHall.js';

// API to get all cinema halls
export const getAllHalls = async (req, res) => {
    try {
        const halls = await CinemaHall.find({ status: 'active' }).sort({ hallNumber: 1 });
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
            return res.json({ success: false, message: 'Hall not found' });
        }
        
        res.json({ success: true, hall });
    } catch (error) {
        console.error('Error fetching hall:', error);
        res.json({ success: false, message: error.message });
    }
};

