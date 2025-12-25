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
        const bookings = await Booking.find({ispaid: true});
        const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie');
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
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1});
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
            populate: 'movie'
        }).sort({createdAt: -1});
        res.json({success: true, bookings});
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
                const {data} = await axios.get(`https://api.themoviedb.org/3/movie/${movie._id}/videos`, {
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
            message: `Updated ${updatedCount} movies successfully. ${errorCount} errors.`,
            updatedCount,
            errorCount,
            totalMovies: movies.length
        });
    } catch (error) {
        console.error('Error updating movies:', error);
        res.json({success: false, message: error.message});
    }
}