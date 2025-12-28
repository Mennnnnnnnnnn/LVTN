

//API lấy thông tin đặt chỗ người dùng

import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";


export const getUserBookings = async (req, res) => {
    try {
        const user = req.auth().userId;
        const bookings = await Booking.find({user}).populate({
            path: 'show',
            populate: {path: 'movie'}
        }).sort({createdAt: -1});
        res.json({success: true, bookings});
    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}
//API Controller Function to update Favorite Movie in MongoDB
export const updateFavorite = async (req, res) => {
    try {
        const {movieId} = req.body;
        const userId = req.auth().userId;
        
        // Find user in MongoDB
        let user = await User.findById(userId);
        
        // If user doesn't exist, create one (shouldn't happen but safety check)
        if(!user){
            const clerkUser = await clerkClient.users.getUser(userId);
            user = await User.create({
                _id: userId,
                name: clerkUser.firstName + ' ' + clerkUser.lastName,
                email: clerkUser.emailAddresses[0].emailAddress,
                image: clerkUser.imageUrl,
                favoriteMovies: []
            });
        }

        // Initialize favoriteMovies array if it doesn't exist
        if(!user.favoriteMovies){
            user.favoriteMovies = [];
        }

        // Toggle favorite
        const movieIndex = user.favoriteMovies.indexOf(movieId);
        let message;
        
        if(movieIndex === -1){
            // Add to favorites
            user.favoriteMovies.push(movieId);
            message = 'Đã thêm vào yêu thích thành công';
        } else {
            // Remove from favorites
            user.favoriteMovies.splice(movieIndex, 1);
            message = 'Đã hủy yêu thích thành công';
        }

        await user.save();

        res.json({success: true, message});

    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}

//API Controller Function to get Favorite Movies from MongoDB
export const getFavorites = async (req, res) => {
    try {
        const userId = req.auth().userId;
        const user = await User.findById(userId).populate('favoriteMovies');
        
        if(!user || !user.favoriteMovies){
            return res.json({success: true, movies: []});
        }

        res.json({success: true, movies: user.favoriteMovies});

    } catch (error) {
        console.error(error.message);
        res.json({success: false, message: error.message});
    }
}