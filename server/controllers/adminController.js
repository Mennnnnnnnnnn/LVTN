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
            // Custom date range
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            bookings = bookings.filter(booking => {
                const bookingDate = new Date(booking.createdAt);
                return bookingDate >= start && bookingDate <= end;
            });
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
        // Only get shows with hall (exclude legacy data)
        const shows = await Show.find({
            showDateTime: {$gte: new Date()},
            hall: {$exists: true}
        }).populate('movie').populate('hall').sort({showDateTime: 1});
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

                // Find the first YouTube trailer
                const trailer = data.results.find(
                    video => video.type === 'Trailer' && video.site === 'YouTube'
                );

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