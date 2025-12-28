import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import CinemaHall from '../models/CinemaHall.js';
import { inngest } from '../inngest/index.js';
// API to get now playing movies from TMDB API with runtime info
export const getNowPlayingMovies = async (req, res) => {
    try {
       const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing?language=vi-VN&region=VN',{
        headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
        }
       });
       
       // Fetch runtime cho mỗi phim (parallel requests để nhanh)
       const moviesWithRuntime = await Promise.all(
           data.results.slice(0, 20).map(async (movie) => {
               try {
                   // Kiểm tra xem movie đã có trong DB chưa
                   const existingMovie = await Movie.findById(movie.id);
                   if (existingMovie?.runtime) {
                       return {
                           ...movie,
                           runtime: existingMovie.runtime,
                           genres: existingMovie.genres
                       };
                   }
                   
                   // Nếu chưa có, fetch từ TMDB
                   const {data: detailData} = await axios.get(
                       `https://api.themoviedb.org/3/movie/${movie.id}?language=vi-VN`,
                       {
                           headers: {
                               Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                           }
                       }
                   );
                   
                   return {
                       ...movie,
                       runtime: detailData.runtime,
                       genres: detailData.genres
                   };
               } catch (error) {
                   console.error(`Error fetching runtime for movie ${movie.id}:`, error);
                   return {
                       ...movie,
                       runtime: null,
                       genres: []
                   };
               }
           })
       );
       
       res.json({success: true, movies: moviesWithRuntime});
       
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
        let isNewMovie = false; // Track nếu đây là movie mới
        if(!movie){
            isNewMovie = true; // Đánh dấu là movie mới
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
        
        /**
         * Conflict Detection Test Cases:
         * 
         * Movie runtime: 180 phút → Total: 210 phút (3.5 giờ)
         * 
         * ✅ VALID (No conflict):
         * - Show A: 10:00 - 13:30
         * - Show B: 14:00 - 17:30  (30 min gap)
         * 
         * ❌ CONFLICT:
         * - Show A: 10:00 - 13:30
         * - Show B: 12:00 - 15:30  (overlaps)
         * 
         * ❌ CONFLICT (same time):
         * - Show A: 14:00 - 17:30
         * - Show B: 14:00 - 17:30
         * 
         * ❌ CONFLICT (1 hour gap, but movie 3.5 hours):
         * - Show A: 14:00 - 17:30
         * - Show B: 15:00 - 18:30
         */

        const showsToCreate = [];
        const conflicts = [];

        // Check each show for conflicts
        for (const show of showsInput) {
            const showDate = show.date;
            for (const time of show.time) {
                const dateTimeString = `${showDate}T${time}`;
                const showDateTime = new Date(dateTimeString);
                const endDateTime = new Date(showDateTime.getTime() + totalDuration * 60000);

                // Check for conflicts with existing shows in the same hall (DB)
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
                        requestedDate: showDate,
                        conflictWith: conflictInfo.movie.title,
                        conflictTime: conflictInfo.showDateTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}),
                        reason: 'Trùng với suất chiếu đã có trong hệ thống'
                    });
                    continue; // Skip to next iteration
                }

                // Check for conflicts with other shows in current request (showsToCreate)
                const internalConflict = showsToCreate.find(existingShow => {
                    // Check if time ranges overlap using simplified logic
                    // Two intervals [A1, A2] and [B1, B2] overlap if: A1 < B2 AND B1 < A2
                    const existingStart = existingShow.showDateTime.getTime();
                    const existingEnd = existingShow.endDateTime.getTime();
                    const newStart = showDateTime.getTime();
                    const newEnd = endDateTime.getTime();

                    // Overlap condition: newStart < existingEnd AND existingStart < newEnd
                    return newStart < existingEnd && existingStart < newEnd;
                });

                if (internalConflict) {
                    const conflictStart = internalConflict.showDateTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
                    const conflictEnd = internalConflict.endDateTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
                    
                    conflicts.push({
                        requestedTime: time,
                        requestedDate: showDate,
                        conflictWith: movie.title,
                        conflictTime: `${conflictStart} - ${conflictEnd}`,
                        reason: `Trùng với suất chiếu ${conflictStart} - ${conflictEnd} (cùng lần thêm)`
                    });
                    continue;
                }

                // No conflicts - add to list
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

        if (conflicts.length > 0) {
            // Tạo message chi tiết
            const conflictDetails = conflicts.map(c => 
                `${c.requestedDate} ${c.requestedTime} - ${c.reason}`
            ).join('\n');
            
            return res.json({
                success: false,
                message: `Phát hiện ${conflicts.length} xung đột lịch chiếu tại ${hall.name}`,
                conflicts,
                details: conflictDetails
            });
        }

        if(showsToCreate.length > 0){
            await Show.insertMany(showsToCreate);
        }

        // Chỉ gửi email thông báo nếu đây là movie MỚI lần đầu
        if(isNewMovie){
            await inngest.send({
                name: "app/show.added",
                data: {
                    movieTitle: movie.title,
                    movieId: movie._id
                }
            });
        }

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