import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import axios from "axios";


//API to check if user is admin
export const isAdmin = async (req, res) => {
    res.json({success: true, isAdmin: true});
}

//API to get dashvoard data
export const getDashboardData = async (req, res) => {
    try {
        const { period = 'all', startDate, endDate } = req.query;
        
        // Get all paid bookings
        let bookings = await Booking.find({ispaid: true});
        
        // Filter by period if specified
        if (period !== 'all' && period !== 'custom') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let startFilter, endFilter;
            
            switch (period) {
                case 'today':
                    startFilter = new Date(today);
                    endFilter = new Date(today);
                    endFilter.setDate(endFilter.getDate() + 1);
                    break;
                    
                case 'thisMonth':
                    startFilter = new Date(today.getFullYear(), today.getMonth(), 1);
                    endFilter = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                    break;
                    
                case 'lastMonth':
                    startFilter = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    endFilter = new Date(today.getFullYear(), today.getMonth(), 1);
                    break;
                    
                case 'last3Months':
                    startFilter = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                    endFilter = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                    break;
                    
                case 'last6Months':
                    startFilter = new Date(today.getFullYear(), today.getMonth() - 6, 1);
                    endFilter = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                    break;
                    
                case 'thisYear':
                    startFilter = new Date(today.getFullYear(), 0, 1);
                    endFilter = new Date(today.getFullYear() + 1, 0, 1);
                    break;
                    
                case 'lastYear':
                    startFilter = new Date(today.getFullYear() - 1, 0, 1);
                    endFilter = new Date(today.getFullYear(), 0, 1);
                    break;
                    
                default:
                    startFilter = null;
                    endFilter = null;
            }
            
            if (startFilter && endFilter) {
                bookings = bookings.filter(booking => {
                    const bookingDate = new Date(booking.createdAt);
                    return bookingDate >= startFilter && bookingDate < endFilter;
                });
            }
        } else if (period === 'custom' && startDate && endDate) {
            // Custom date range - Parse dates in local timezone and compare date-only
            const parseLocalDate = (dateString) => {
                const [year, month, day] = dateString.split('-').map(Number);
                return new Date(year, month - 1, day); // month is 0-indexed, creates local date
            };
            
            // Helper to get date-only (local) from any date
            const getDateOnly = (date) => {
                const d = new Date(date);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            };
            
            const startFilter = parseLocalDate(startDate);
            const endFilter = parseLocalDate(endDate);
            const endFilterNextDay = new Date(endFilter);
            endFilterNextDay.setDate(endFilterNextDay.getDate() + 1);
            
            const startDateOnly = getDateOnly(startFilter);
            const endDateOnly = getDateOnly(endFilterNextDay);
            
            // Debug logging (can be removed later)
            console.log('Custom filter - startDate:', startDate, 'endDate:', endDate);
            console.log('Date range:', startDateOnly, 'to', endDateOnly);
            console.log('Total bookings before filter:', bookings.length);
            
            bookings = bookings.filter(booking => {
                // Convert booking.createdAt to local date-only for comparison
                const bookingDateOnly = getDateOnly(booking.createdAt);
                
                // Compare date-only values: >= start and < end (exclusive, like "today" filter)
                const isInRange = bookingDateOnly >= startDateOnly && bookingDateOnly < endDateOnly;
                
                // Debug logging for first few bookings
                if (bookings.indexOf(booking) < 3) {
                    console.log('Booking date:', booking.createdAt, '-> Local date-only:', bookingDateOnly, 'In range:', isInRange);
                }
                
                return isInRange;
            });
            
            console.log('Total bookings after filter:', bookings.length);
        }
        
        // Only get shows with hall (exclude legacy data)
        const activeShows = await Show.find({
            showDateTime: {$gte: new Date()},
            hall: {$exists: true}
        }).populate('movie');
        const totalUser = await User.countDocuments();
        
        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUser
        }
        res.json({success: true,dashboardData});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//API to get all shows

export const getAllShows = async (req, res) => {
    try {
        const { status } = req.query; // Allow filtering by status via query param
        
        const now = new Date();
        
        // Step 1: Update completed shows (shows that have passed endDateTime)
        await Show.updateMany(
            {
                endDateTime: { $lt: now },
                status: { $in: ['upcoming', 'active'] }
            },
            {
                $set: { status: 'completed' }
            }
        );
        
        // Step 2: Update active shows (shows currently running)
        await Show.updateMany(
            {
                showDateTime: { $lte: now },
                endDateTime: { $gte: now },
                status: 'upcoming'
            },
            {
                $set: { status: 'active' }
            }
        );
        
        // Build query - get all shows with hall (for admin to see all statuses)
        const query = {
            hall: {$exists: true}
        };
        
        // If status filter is provided and not 'all', filter by status
        if (status && status !== 'all') {
            query.status = status;
            // For completed/cancelled, show all shows (past and future)
            // For upcoming/active, only show future shows
            if (status === 'upcoming' || status === 'active') {
                query.showDateTime = {$gte: new Date()};
            }
        } else {
            // When status = 'all': show ALL shows in DB (all statuses, past and future)
            // Don't filter by time or status when showing 'all'
        }
        
        const shows = await Show.find(query).populate('movie').populate('hall').sort({showDateTime: 1});
        res.json({success: true, shows});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//API to get all bookings

export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path: 'show',
            populate: [
                { path: 'movie' },
                { path: 'hall' }
            ]
        }).sort({createdAt: -1});
        res.json({success: true, bookings});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//API to get all users

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('favoriteMovies').sort({createdAt: -1});
        res.json({success: true, users});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

//API to update all movies with trailer data
export const updateMoviesWithTrailers = async (req, res) => {
    try {
        const movies = await Movie.find({});
        let updatedCount = 0;
        let errorCount = 0;

        for (const movie of movies) {
            try {
                // Fetch trailer data from TMDB
                const {data} = await axios.get(`https://api.themoviedb.org/3/movie/${movie._id}/videos`, { // Không thêm language cho videos
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                });

                // ✅ Ưu tiên trailer tiếng Việt, nếu không có thì lấy tiếng Anh
                const allTrailers = data.results.filter(
                    video => video.type === 'Trailer' && video.site === 'YouTube'
                );
                
                let trailer = allTrailers.find(video => video.iso_639_1 === 'vi'); // Ưu tiên tiếng Việt
                if (!trailer) {
                    trailer = allTrailers.find(video => video.iso_639_1 === 'en'); // Fallback sang tiếng Anh
                }
                if (!trailer) {
                    trailer = allTrailers[0]; // Nếu không có cả hai, lấy trailer đầu tiên
                }

                if (trailer) {
                    movie.trailer_key = trailer.key;
                    await movie.save();
                    updatedCount++;
                } else {
                    movie.trailer_key = "";
                    await movie.save();
                }
            } catch (error) {
                console.error(`Error updating movie ${movie._id}:`, error.message);
                errorCount++;
            }
        }

        res.json({
            success: true, 
            message: `Cập nhật ${updatedCount} phim thành công. ${errorCount} lỗi.`,
            updatedCount,
            errorCount,
            totalMovies: movies.length
        });
    } catch (error) {
        console.error('Error updating movies:', error);
        res.json({success: false, message: error.message});
    }
}

//API to cancel/delete a show (only if no bookings exist)
export const cancelShow = async (req, res) => {
    try {
        const { showId } = req.params;

        // Check if show exists
        const show = await Show.findById(showId);
        if (!show) {
            return res.json({success: false, message: 'Không tìm thấy chương trình'});
        }

        // Check if there are any occupied seats (actual bookings)
        const occupiedSeatsCount = Object.keys(show.occupiedSeats || {}).length;
        if (occupiedSeatsCount > 0) {
            return res.json({
                success: false, 
                message: 'Không thể hủy chương trình vì đã có người đặt vé'
            });
        }

        // Also check for any paid bookings (as a safety check)
        const paidBookings = await Booking.find({ 
            show: showId, 
            ispaid: true,
            status: { $ne: 'cancelled' }
        });
        if (paidBookings.length > 0) {
            return res.json({
                success: false, 
                message: 'Không thể hủy chương trình vì đã có người đặt vé'
            });
        }

        // Check if show has already passed or is completed
        if (show.status === 'completed') {
            return res.json({
                success: false, 
                message: 'Không thể hủy chương trình đã hoàn thành'
            });
        }

        // Update status to cancelled instead of deleting
        show.status = 'cancelled';
        await show.save();

        res.json({
            success: true, 
            message: 'Hủy chương trình thành công'
        });
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}