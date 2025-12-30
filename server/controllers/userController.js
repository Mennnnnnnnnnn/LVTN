

//API lấy thông tin đặt chỗ người dùng

import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";
import axios from 'axios';


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
            // ✅ Add to favorites
            
            // Check xem movie đã có trong DB chưa
            let movie = await Movie.findById(movieId);
            
            // Nếu chưa có → Fetch từ TMDB và lưu vào DB
            if(!movie){
                try {
                    console.log(`Fetching movie ${movieId} from TMDB for favorite...`);
                    
                    const [movieDetailsResponse, movieCreditsResponse, movieVideosResponse] = await Promise.all([
                        axios.get(`https://api.themoviedb.org/3/movie/${movieId}?language=vi-VN`,{
                            headers: {
                                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                            }
                        }),
                        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits?language=vi-VN`,{
                            headers: {
                                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                            }
                        }),
                        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`,{
                            headers: {
                                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                            }
                        })
                    ]);
                    
                    const movieApiData = movieDetailsResponse.data;
                    const movieCreditsData = movieCreditsResponse.data;
                    const movieVideosData = movieVideosResponse.data;

                    const trailer = movieVideosData.results.find(
                        video => video.type === 'Trailer' && video.site === 'YouTube'
                    );

                    // Fallback overview sang tiếng Anh nếu cần
                    let overview = movieApiData.overview;
                    if (!overview || overview.trim() === '') {
                        try {
                            const {data: englishData} = await axios.get(
                                `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                                    }
                                }
                            );
                            overview = englishData.overview || 'Nội dung phim đang được cập nhật...';
                        } catch (error) {
                            overview = 'Nội dung phim đang được cập nhật...';
                        }
                    }

                    const movieDetails = {
                        _id: movieId,
                        title: movieApiData.title,
                        overview: overview,
                        poster_path: movieApiData.poster_path,
                        backdrop_path: movieApiData.backdrop_path,
                        genres: movieApiData.genres,
                        casts: movieCreditsData.cast,
                        release_date: movieApiData.release_date,
                        original_language: movieApiData.original_language,
                        tagline: movieApiData.tagline||"",
                        vote_average: movieApiData.vote_average,
                        runtime: movieApiData.runtime,
                        trailer_key: trailer?.key || "",
                    };
                    
                    // Lưu movie vào DB
                    movie = await Movie.create(movieDetails);
                    console.log(`Movie ${movieId} saved to DB for favorite!`);
                    
                } catch (tmdbError) {
                    console.error('Error fetching movie from TMDB:', tmdbError);
                    return res.json({success: false, message: 'Không thể lấy thông tin phim từ TMDB'});
                }
            }
            
            // Add vào favorites
            user.favoriteMovies.push(movieId);
            message = 'Đã thêm vào yêu thích thành công';
        } else {
            // ❌ Remove from favorites
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