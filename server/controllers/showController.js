import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import CinemaHall from '../models/CinemaHall.js';
import { inngest } from '../inngest/index.js';

// Helper function to automatically update status of expired shows to 'completed'
const updateCompletedShows = async () => {
    try {
        const now = new Date();
        const result = await Show.updateMany(
            {
                endDateTime: { $lt: now },
                status: { $in: ['upcoming', 'active'] }
            },
            {
                $set: { status: 'completed' }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(`Updated ${result.modifiedCount} shows to completed status`);
        }
    } catch (error) {
        console.error('Error updating completed shows:', error);
    }
};

// API to get upcoming movies from TMDB API
export const getUpcomingMovies = async (req, res) => {
    try {
        // Lấy phim sắp khởi chiếu tại Việt Nam (chính xác hơn)
        const { data } = await axios.get('https://api.themoviedb.org/3/movie/upcoming?language=vi-VN&region=VN', {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
            }
        });

        // Filter và sort phim sắp khởi chiếu
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingMovies = data.results
            .filter(movie => {
                const releaseDate = new Date(movie.release_date);
                // Chỉ lấy phim có ngày khởi chiếu trong tương lai
                return releaseDate >= today;
            })
            .sort((a, b) => {
                // Ưu tiên phim MỚI: sort theo ngày release giảm dần
                // Phim gần ngày hôm nay hơn sẽ lên đầu
                return new Date(a.release_date) - new Date(b.release_date);
            });

        // Fetch runtime và filter phim cũ (parallel requests)
        const moviesPromises = upcomingMovies.slice(0, 40).map(async (movie) => {
            try {
                // Kiểm tra xem movie đã có trong DB chưa
                const existingMovie = await Movie.findById(movie.id);
                if (existingMovie?.runtime) {
                    return {
                        ...movie,
                        runtime: existingMovie.runtime,
                        genres: existingMovie.genres,
                        originalYear: new Date(existingMovie.release_date).getFullYear()
                    };
                }

                // Nếu chưa có, fetch từ TMDB để lấy thông tin đầy đủ
                const { data: detailData } = await axios.get(
                    `https://api.themoviedb.org/3/movie/${movie.id}?language=vi-VN`,
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                        }
                    }
                );

                // Nếu overview tiếng Việt rỗng, fallback sang tiếng Anh
                let overview = detailData.overview || movie.overview;
                if (!overview || overview.trim() === '') {
                    try {
                        const { data: englishData } = await axios.get(
                            `https://api.themoviedb.org/3/movie/${movie.id}?language=en-US`,
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

                // Lấy năm sản xuất gốc từ release_date trong detail
                const originalYear = new Date(detailData.release_date).getFullYear();

                return {
                    ...movie,
                    overview: overview,
                    runtime: detailData.runtime,
                    genres: detailData.genres,
                    originalYear: originalYear
                };
            } catch (error) {
                console.error(`Error fetching detail for movie ${movie.id}:`, error);
                return null;
            }
        });

        const moviesResults = await Promise.all(moviesPromises);

        // Filter: Loại phim tái chiếu quá cũ (trước 2020)
        const moviesWithRuntime = moviesResults
            .filter(movie => movie !== null && movie.originalYear >= 2020)
            .slice(0, 40); // Tăng từ 20 lên 40 phim

        res.json({ success: true, movies: moviesWithRuntime });

    } catch (error) {
        console.error('Error fetching upcoming movies:', error);
        res.json({ success: false, movies: [] })
    }
}

// API to get now playing movies from TMDB API with runtime info
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing?language=vi-VN&region=VN', {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
            }
        });

        // Fetch runtime cho mỗi phim (parallel requests để nhanh)
        const moviesWithRuntime = await Promise.all(
            data.results.slice(0, 40).map(async (movie) => { // Tăng từ 20 lên 40 phim
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
                    const { data: detailData } = await axios.get(
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

        res.json({ success: true, movies: moviesWithRuntime });

    } catch (error) {
        console.error('Error fetching now playing movies:', error);
        res.json({ success: false, movies: [] })
    }
}
//API to add a new show to the database
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice, hallId } = req.body;

        // Validate hall exists
        const hall = await CinemaHall.findById(hallId);
        if (!hall) {
            return res.json({ success: false, message: 'Phòng chiếu không tồn tại' });
        }

        if (hall.status === 'maintenance') {
            return res.json({ success: false, message: 'Phòng chiếu đang bảo trì' });
        }

        if (hall.status === 'inactive') {
            return res.json({success: false, message: 'Phòng chiếu đã bị vô hiệu hóa'});
        }

        let movie = await Movie.findById(movieId);
        let isNewMovie = false; // Track nếu đây là movie mới
        let movieReleaseDate = null;

        if (!movie) {
            isNewMovie = true; // Đánh dấu là movie mới
            //Fetch movie details, credits and videos from TMDB API
            const [movieDetailsResponse, movieCreditsResponse, movieVideosResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}?language=vi-VN`, {
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits?language=vi-VN`, {
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, { // Không thêm language cho videos
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                })
            ]);
            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;
            const movieVideosData = movieVideosResponse.data;

            // ✅ Tìm video trailer/teaser từ YouTube
            // Ưu tiên: Trailer > Teaser > Clip > Featurette
            const videoTypes = ['Trailer', 'Teaser', 'Clip', 'Featurette'];
            const allVideos = movieVideosData.results.filter(
                video => video.site === 'YouTube' && videoTypes.includes(video.type)
            );
            
            let trailer = null;
            
            // Tìm theo thứ tự ưu tiên: Trailer > Teaser > Clip > Featurette
            for (const videoType of videoTypes) {
                const videosOfType = allVideos.filter(v => v.type === videoType);
                
                // Ưu tiên tiếng Việt
                trailer = videosOfType.find(video => video.iso_639_1 === 'vi');
                if (trailer) break;
                
                // Fallback sang tiếng Anh
                trailer = videosOfType.find(video => video.iso_639_1 === 'en');
                if (trailer) break;
                
                // Nếu không có cả hai, lấy video đầu tiên của loại này
                if (videosOfType.length > 0) {
                    trailer = videosOfType[0];
                    break;
                }
            }

            // ✅ Fallback overview sang tiếng Anh nếu tiếng Việt rỗng
            let overview = movieApiData.overview;
            if (!overview || overview.trim() === '') {
                try {
                    const { data: englishData } = await axios.get(
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

            movieReleaseDate = new Date(movieApiData.release_date);

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
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
                trailer_key: trailer?.key || "",
            }
            // Add movie to database
            movie = await Movie.create(movieDetails);
        } else {
            movieReleaseDate = new Date(movie.release_date);
        }

        // Chuẩn bị date để so sánh
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        movieReleaseDate.setHours(0, 0, 0, 0);

        // ✅ Admin có thể add show BẤT CỨ LÚC NÀO
        // ✅ Validation chỉ check: Ngày show phải >= ngày khởi chiếu (check trong vòng lặp bên dưới)

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

                // ✅ Validation: Ngày show LUÔN phải >= ngày khởi chiếu phim (cả phim đang chiếu và sắp chiếu)
                const showDateOnly = new Date(showDate);
                showDateOnly.setHours(0, 0, 0, 0);

                // So sánh đầy đủ: Year, Month, Day
                if (showDateOnly.getTime() < movieReleaseDate.getTime()) {
                    conflicts.push({
                        requestedTime: time,
                        requestedDate: showDate,
                        conflictWith: movie.title,
                        conflictTime: '',
                        reason: `Không thể tạo suất chiếu trước ngày khởi chiếu phim (${movieReleaseDate.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })})`
                    });
                    continue;
                }

                // ✅ Validation: Giới hạn thêm suất chiếu tối đa 90 ngày trong tương lai
                const MAX_DAYS_AHEAD = 90; // Giới hạn 90 ngày
                const maxAllowedDate = new Date(today);
                maxAllowedDate.setDate(maxAllowedDate.getDate() + MAX_DAYS_AHEAD);
                maxAllowedDate.setHours(23, 59, 59, 999);

                if (showDateTime.getTime() > maxAllowedDate.getTime()) {
                    conflicts.push({
                        requestedTime: time,
                        requestedDate: showDate,
                        conflictWith: 'Hệ thống',
                        conflictTime: '',
                        reason: `Không thể tạo suất chiếu quá ${MAX_DAYS_AHEAD} ngày trong tương lai (tối đa đến ${maxAllowedDate.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })})`
                    });
                    continue;
                }

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
                        conflictTime: conflictInfo.showDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
                    const conflictStart = internalConflict.showDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const conflictEnd = internalConflict.endDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

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
                    status: 'upcoming',
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

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        }

        // Chỉ gửi email thông báo nếu đây là movie MỚI lần đầu
        if (isNewMovie) {
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
        res.json({ success: false, message: 'Không thể thêm suất chiếu' })
    }
}
//API to get all shows from the database
export const getShows = async (req, res) => {
    try {
        // Update completed shows before querying
        await updateCompletedShows();
        
        const shows = await Show.find({ 
            showDateTime: { $gte: new Date() },
            status: { $nin: ['completed', 'cancelled'] }
        }).populate('movie').sort({ showDateTime: 1 });
        //filter unique shows
        const uniqueShows = new Set(shows.map(show => show.movie));

        res.json({ success: true, shows: Array.from(uniqueShows) });
    } catch (error) {
        console.error('Error fetching shows:', error);
        res.json({ success: false, message: error.message });

    }
}

//API to get a single show from the database
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        //nhận tất cả các chương trình sắp tới của bộ phim
        const shows = await Show.find({ 
            movie: movieId, 
            showDateTime: { $gte: new Date() },
            status: { $nin: ['completed', 'cancelled'] }
        }).populate('hall');
        let movie = await Movie.findById(movieId);

        // Nếu movie chưa có trong DB (phim sắp khởi chiếu), fetch từ TMDB
        if (!movie) {
            try {
                const [movieDetailsResponse, movieCreditsResponse, movieVideosResponse] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}?language=vi-VN`, {
                        headers: {
                            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                        }
                    }),
                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits?language=vi-VN`, {
                        headers: {
                            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                        }
                    }),
                    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
                        headers: {
                            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                        }
                    })
                ]);

                const movieApiData = movieDetailsResponse.data;
                const movieCreditsData = movieCreditsResponse.data;
                const movieVideosData = movieVideosResponse.data;

                // ✅ Tìm video trailer/teaser từ YouTube
                // Ưu tiên: Trailer > Teaser > Clip > Featurette
                const videoTypes = ['Trailer', 'Teaser', 'Clip', 'Featurette'];
                const allVideos = movieVideosData.results.filter(
                    video => video.site === 'YouTube' && videoTypes.includes(video.type)
                );
                
                let trailer = null;
                
                // Tìm theo thứ tự ưu tiên: Trailer > Teaser > Clip > Featurette
                for (const videoType of videoTypes) {
                    const videosOfType = allVideos.filter(v => v.type === videoType);
                    
                    // Ưu tiên tiếng Việt
                    trailer = videosOfType.find(video => video.iso_639_1 === 'vi');
                    if (trailer) break;
                    
                    // Fallback sang tiếng Anh
                    trailer = videosOfType.find(video => video.iso_639_1 === 'en');
                    if (trailer) break;
                    
                    // Nếu không có cả hai, lấy video đầu tiên của loại này
                    if (videosOfType.length > 0) {
                        trailer = videosOfType[0];
                        break;
                    }
                }

                // Fallback overview sang tiếng Anh nếu tiếng Việt rỗng
                let overview = movieApiData.overview;
                if (!overview || overview.trim() === '') {
                    try {
                        const { data: englishData } = await axios.get(
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

                // Tạo object movie tạm thời (chưa lưu vào DB)
                movie = {
                    _id: movieId,
                    title: movieApiData.title,
                    overview: overview,
                    poster_path: movieApiData.poster_path,
                    backdrop_path: movieApiData.backdrop_path,
                    genres: movieApiData.genres,
                    casts: movieCreditsData.cast,
                    release_date: movieApiData.release_date,
                    original_language: movieApiData.original_language,
                    tagline: movieApiData.tagline || "",
                    vote_average: movieApiData.vote_average,
                    runtime: movieApiData.runtime,
                    trailer_key: trailer?.key || "",
                };
            } catch (tmdbError) {
                console.error('Error fetching movie from TMDB:', tmdbError);
                return res.json({ success: false, message: 'Không tìm thấy thông tin phim' });
            }
        }

        const dateTime = {};
        let showPrice = 0;
        let hall = null;

        // ✅ Filter out shows in maintenance or inactive halls
        const activeShows = shows.filter(show =>
            show.hall && show.hall.status === 'active'
        );

        activeShows.forEach(show => {
            const dateKey = show.showDateTime.toISOString().split('T')[0];
            if (!dateTime[dateKey]) {
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
                    priceMultiplier: show.hall.priceMultiplier,
                    brokenSeats: show.hall.brokenSeats || []  // ✅ Thêm ghế hỏng
                }
            });
            // Lấy showPrice và hall từ show đầu tiên
            if (showPrice === 0) {
                showPrice = displayPrice; // Trả giá đã nhân
                hall = show.hall;
            }
        });
        res.json({ success: true, movie, dateTime, showPrice, hall });
    } catch (error) {
        console.error('Error fetching shows:', error);
        res.json({ success: false, message: error.message });
    }
}

// API to search movies by title and genre
export const searchMovies = async (req, res) => {
    try {
        const { query, genre } = req.query;

        // Get all shows with populated movie data
        const shows = await Show.find({
            showDateTime: { $gte: new Date() },
            hall: { $exists: true },
            status: { $nin: ['completed', 'cancelled'] }
        }).populate('movie').populate('hall');

        // Filter active shows
        const activeShows = shows.filter(show =>
            show.movie && show.hall && show.hall.status === 'active'
        );

        // Get unique movies from shows
        const movieMap = new Map();
        activeShows.forEach(show => {
            if (!movieMap.has(show.movie._id)) {
                movieMap.set(show.movie._id, show.movie);
            }
        });

        let movies = Array.from(movieMap.values());

        // Filter by search query (title)
        if (query && query.trim() !== '') {
            const searchTerm = query.toLowerCase().trim();
            movies = movies.filter(movie =>
                movie.title.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by genre
        if (genre && genre.trim() !== '' && genre !== 'all') {
            movies = movies.filter(movie =>
                movie.genres && movie.genres.some(g =>
                    g.name.toLowerCase() === genre.toLowerCase() ||
                    g.id.toString() === genre
                )
            );
        }

        res.json({ success: true, movies });
    } catch (error) {
        console.error('Error searching movies:', error);
        res.json({ success: false, message: error.message, movies: [] });
    }
}

// API to get all genres from current movies
export const getGenres = async (req, res) => {
    try {
        // Get all shows with populated movie data
        const shows = await Show.find({
            showDateTime: { $gte: new Date() },
            hall: { $exists: true },
            status: { $nin: ['completed', 'cancelled'] }
        }).populate('movie').populate('hall');

        // Filter active shows
        const activeShows = shows.filter(show =>
            show.movie && show.hall && show.hall.status === 'active'
        );

        // Get unique genres from all movies
        const genreMap = new Map();
        activeShows.forEach(show => {
            if (show.movie && show.movie.genres) {
                show.movie.genres.forEach(genre => {
                    if (!genreMap.has(genre.id)) {
                        genreMap.set(genre.id, genre);
                    }
                });
            }
        });

        const genres = Array.from(genreMap.values());
        res.json({ success: true, genres });
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.json({ success: false, message: error.message, genres: [] });
    }
}