import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dummyDateTimeData, dummyShowsData } from '../assets/assets';
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import { formatDate, getYear } from '../lib/dateFormat';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard';
import Loading from '../components/Loading';
import TrailerModal from '../components/TrailerModal';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
const MovieDetails = () => {
  const navigate = useNavigate()
  const {id} = useParams()
  const [show, setShow] = useState(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false)

  const {shows, axios, getToken, user, fetchFavoriteMovies, favoriteMovies, setFavoriteMovies, image_base_url} = useAppContext();
  
  const getShow = async ()=>{
    try {
      const {data} = await axios.get(`/api/show/${id}`);
      if(data.success){
        setShow(data);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleFavorite = async()=>{
    try {
      if(!user) return toast.error("Vui long dang nhap de thuc hien chuc nang nay");
      
      // Ngăn spam request khi click liên tục
      if(isUpdatingFavorite) return;
      
      setIsUpdatingFavorite(true);

      // Optimistic UI Update - Đổi UI ngay lập tức
      const isFavorited = favoriteMovies.find(movie => movie._id === id);
      
      if(isFavorited) {
        // Remove khỏi danh sách
        setFavoriteMovies(prev => prev.filter(movie => movie._id !== id));
      } else {
        // Add vào danh sách (tạm thời với movie từ show)
        setFavoriteMovies(prev => [...prev, { _id: id, ...show.movie }]);
      }

      // Gọi API
      const {data} = await axios.post('/api/user/update-favorite', {movieId: id}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      
      if(data.success){
        // Hiển thị toast phù hợp với hành động
        if(isFavorited) {
          toast.success("Đã hủy yêu thích thành công");
        } else {
          toast.success("Đã thêm vào yêu thích thành công");
        }
      }
      
    } catch (error) {
      console.log(error);
      // Nếu lỗi, rollback lại UI
      const isFavorited = favoriteMovies.find(movie => movie._id === id);
      if(!isFavorited) {
        // Nếu đã add mà lỗi → remove lại
        setFavoriteMovies(prev => prev.filter(movie => movie._id !== id));
      } else {
        // Nếu đã remove mà lỗi → add lại
        setFavoriteMovies(prev => [...prev, { _id: id, ...show.movie }]);
      }
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsUpdatingFavorite(false);
    }
  }

  const handleWatchTrailer = () => {
    if(!show?.movie?.trailer_key){
      toast.error("Trailer không khả dụng");
      return;
    }
    setShowTrailer(true);
  }

  useEffect (()=>{
    getShow()
  }, [id])
  return show ?  (
    <div className='px-6 md:px-16 lg:px-40 pt-30 md:pt-50'>
      {/* Trailer Modal */}
      {showTrailer && show.movie.trailer_key && (
        <TrailerModal 
          trailerKey={show.movie.trailer_key} 
          onClose={() => setShowTrailer(false)} 
        />
      )}
      
      <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'>
        <img src={image_base_url + show.movie.poster_path} alt="" className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover' />
        <div className='relative flex flex-col gap-3'>
          <BlurCircle top="-100px" left="-100px" />
          <p className='text-primary'>VIETNAMESE SUBTITLE</p>
          <h1 className='text-4xl font-semibold max-w-96 text-balance'>{show.movie.title}</h1>
          <div className='flex items-center gap-2 text-gray-300'>
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average.toFixed(1)} Đánh giá bởi người dùng
          </div>
          <p className='text-grap-400 mt-2 text-sm leading-tight max-w-xl'>{show.movie.overview}</p>
          <p>
            {timeFormat(show.movie.runtime)} • {show.movie.genres.map(genre => 
              genre.name).join(", ")} • {getYear(show.movie.release_date)}
          </p>
          <p className='text-gray-400 text-sm'>
            <span className='text-gray-300 font-medium'>Ngày khởi chiếu:</span> {formatDate(show.movie.release_date)}
          </p>
          <div className='flex items-center flex-wrap gap-4 mt-4'>
            <button 
              onClick={handleWatchTrailer}
              className='flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition
             rounded-md font-medium  cursor-pointer active:scale-95'>
              <PlayCircleIcon className="w-5 h-5" />
              Xem trailer
              </button>
            <a href="#dateSelect" className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95 '>Mua vé </a>
            <button onClick={handleFavorite} className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95'>
              <Heart className={`w-5 h-5 ${favoriteMovies.find(movie => movie._id === id) ? 'fill-primary text-primary' : ""}`} />
            </button>
          </div>
        </div>
      </div>
      
      <p className='text-lg font-medium mt-20'>Dàn diễn viên</p>
      <div className='overflow-x-auto no-scollbar mt-8 pb-4'>
        <div className='flex items-center gap-4 w-max px-4'>
            {show.movie.casts.slice(0,12).map((cast, index)=>(
              <div key={index} className='flex flex-col items-center text-center'>
                <img src={image_base_url + cast.profile_path} alt="" className='rounded-full h-20 md:h-20 aspect-square object-cover' />
                <p className='font-medium text-xs mt-3'>{cast.name}</p>
              </div>
            ))}
        </div>
      </div>
      <DateSelect dateTime={show.dateTime} id={id} />
      <p className='text-lg font-medium mt-20 mb-8'>Có thể bạn thích</p>
      <div className=' flex flex-wrap max-sm:justify-center gap-8'>
        {shows.slice(0,4).map((movie, index)=>(
          <MovieCard key={index} movie={movie} />
        ))}
      </div>
      <div className='flex justify-center mt-20'>
        <button onClick={()=> {navigate('/movies') ; scrollTo(0,0)}} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'>Xem thêm</button>
      </div>
    </div>
  ) : <Loading />
}
export default MovieDetails