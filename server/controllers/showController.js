import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import CinemaHall from '../models/CinemaHall.js';
import { inngest } from '../inngest/index.js';
// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res) => {
    try {
       const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing?language=vi-VN&region=VN',{
        headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
        }
       })
       const movies = data.results;
       res.json({success: true, movies:movies})
       
    } catch (error) {        
        console.error('Error fetching now playing movies:', error);
        res.json({success: false, movies:[]} )
    }
}
//API to add a new show to the database
export const addShow = async (req, res) => {
    try {
        const {movieId, showsInput, showPrice, hallId} = req.body;
        
        // Validate hall exists
        const hall = await CinemaHall.findById(hallId);
        if (!hall) {
            return res.json({success: false, message: 'Phòng chiếu không tồn tại'});
        }

        if (hall.status === 'maintenance') {
            return res.json({success: false, message: 'Phòng chiếu đang bảo trì'});
        }

        let movie = await Movie.findById(movieId);
        if(!movie){
            //Fetch movie details, credits and videos from TMDB API
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
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`,{ // Không thêm language cho videos
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                })
            ]);
            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;
            const movieVideosData = movieVideosResponse.data;

            // Find the first YouTube trailer
            const trailer = movieVideosData.results.find(
                video => video.type === 'Trailer' && video.site === 'YouTube'
            );

            const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
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
            }
            // Add movie to database
            movie = await Movie.create(movieDetails);
        }

        // Calculate show end time (runtime + buffer + cleaning)
        const BUFFER_TIME = 10; // phút (quảng cáo, giới thiệu)
        const CLEANING_TIME = 20; // phút (vệ sinh phòng)
        const totalDuration = movie.runtime + BUFFER_TIME + CLEANING_TIME; // tổng phút

        const showsToCreate = [];
        const conflicts = [];

        // Check each show for conflicts
        for (const show of showsInput) {
            const showDate = show.date;
            for (const time of show.time) {
                const dateTimeString = `${showDate}T${time}`;
                const showDateTime = new Date(dateTimeString);
                const endDateTime = new Date(showDateTime.getTime() + totalDuration * 60000);

                // Check for conflicts with existing shows in the same hall
                const conflictingShows = await Show.find({
                    hall: hallId,
                    $or: [
                        // New show starts during existing show
                        {
                            showDateTime: { $lte: showDateTime },
                            endDateTime: { $gt: showDateTime }
                        },
                        // New show ends during existing show
                        {
                            showDateTime: { $lt: endDateTime },
                            endDateTime: { $gte: endDateTime }
                        },
                        // New show completely overlaps existing show
                        {
                            showDateTime: { $gte: showDateTime },
                            endDateTime: { $lte: endDateTime }
                        }
                    ]
                }).populate('movie');

                if (conflictingShows.length > 0) {
                    const conflictInfo = conflictingShows[0];
                    conflicts.push({
                        requestedTime: time,
                        conflictWith: conflictInfo.movie.title,
                        conflictTime: conflictInfo.showDateTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})
                    });
                } else {
                    showsToCreate.push({
                        movie: movieId,
                        hall: hallId,
                        showDateTime,
                        endDateTime,
                        showPrice,
                        occupiedSeats: {},
                    });
                }
            }
        }

        if (conflicts.length > 0) {
            return res.json({
                success: false,
                message: `Phòng ${hall.name} đã có lịch chiếu trùng`,
                conflicts
            });
        }

        if(showsToCreate.length > 0){
            await Show.insertMany(showsToCreate);
        }

        //trigger inngest event
        await inngest.send({
            name: "app/show.added",
            data: {
                movieTitle: movie.title
            }
        })

        res.json({
            success: true, 
            message: `Đã thêm ${showsToCreate.length} suất chiếu thành công tại ${hall.name}`
        });
    } catch (error) {
        console.error('Error adding show:', error);
        res.json({success: false, message: 'Failed to add show'})
    }
}
//API to get all shows from the database
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1});
        //filter unique shows
        const uniqueShows = new Set(shows.map(show => show.movie));

        res.json({success: true, shows: Array.from(uniqueShows)});
    } catch (error) {
        console.error('Error fetching shows:', error);
        res.json({success: false, message: error.message});
        
    }
}

 //API to get a single show from the database
 export const getShow = async (req, res) => {
    try {
        const {movieId} = req.params;
        //nhận tất cả các chương trình sắp tới của bộ phim
        const shows = await Show.find({movie: movieId, showDateTime: {$gte: new Date()}}).populate('hall');
        const movie = await Movie.findById(movieId);
        const dateTime = {};
        let showPrice = 0;
        let hall = null;
        
        shows.forEach(show => {
            const dateKey = show.showDateTime.toISOString().split('T')[0];
            if(!dateTime[dateKey]){
                dateTime[dateKey] = [];
            }
            
            // Tính giá hiển thị = giá base × priceMultiplier
            const basePrice = show.showPrice;
            const displayPrice = basePrice * show.hall.priceMultiplier;
            
            // Check nếu suất chiếu tối (sau 17h)
            const showHour = show.showDateTime.getHours();
            const isEveningShow = showHour >= 17;
            
            dateTime[dateKey].push({
                time: show.showDateTime, 
                showId: show._id,
                basePrice: basePrice, // Giá gốc
                showPrice: displayPrice, // Giá đã nhân với multiplier
                isEveningShow: isEveningShow, // Có phải suất tối không
                hall: {
                    _id: show.hall._id,
                    name: show.hall.name,
                    type: show.hall.type,
                    hallNumber: show.hall.hallNumber,
                    totalSeats: show.hall.totalSeats,
                    seatLayout: show.hall.seatLayout,
                    customRowSeats: show.hall.customRowSeats,
                    priceMultiplier: show.hall.priceMultiplier
                }
            });
            // Lấy showPrice và hall từ show đầu tiên
            if(showPrice === 0) {
                showPrice = displayPrice; // Trả giá đã nhân
                hall = show.hall;
            }
        });
        res.json({success: true, movie, dateTime, showPrice, hall});
    } catch (error) {
        console.error('Error fetching shows:', error);
        res.json({success: false, message: error.message});
    }
 }