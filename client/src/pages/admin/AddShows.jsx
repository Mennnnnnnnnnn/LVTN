import React, { useEffect, useState } from 'react';
import { dummyShowsData } from '../../assets/assets';
import Loading from '../../components/Loading';
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react';
import Title from '../../components/admin/Title';
import { kConverter } from '../../lib/kConverter';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AddShows = () => {

  const {axios, getToken, user, image_base_url} = useAppContext();

  const [nowPlayingMovies , setNowPlayingMovies] = useState([]) ;
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [activeTab, setActiveTab] = useState('now-playing'); // 'now-playing' or 'upcoming'
  const [cinemaHalls, setCinemaHalls] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedHall, setSelectedHall] = useState(null);
  const [dateTimeSelection , setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState ("");
  const [showPrice , setShowPrice] = useState("");

  const [addingShow, setAddingShow] = useState(false);

  const fetchNowPlayingMovies = async() =>{
    try {
      const {data} = await axios.get('/api/show/now-playing',{
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if(data.success){
        setNowPlayingMovies(data.movies);
      }
    } catch (error) {
      console.error('Error fetching movies:',error)
    }
  };

  const fetchUpcomingMovies = async() => {
    try {
      const {data} = await axios.get('/api/show/upcoming');
      if(data.success){
        setUpcomingMovies(data.movies);
      }
    } catch (error) {
      console.error('Error fetching upcoming movies:', error)
    }
  };

  const fetchCinemaHalls = async() => {
    try {
      const {data} = await axios.get('/api/hall/all');
      if(data.success){
        setCinemaHalls(data.halls);
      }
    } catch (error) {
      console.error('Error fetching cinema halls:',error)
    }
  };
   const handleDateTimeAdd = () => {
    if(!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T")
    if (!date || !time) return;
    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if(!times.includes(time)) {
        return {...prev, [date]: [...times,time] };
      }
      return prev;
    });
   };
   const handleRemoveTime = (date,time) =>{
    setDateTimeSelection ((prev) => {
      const filteredTimes = prev[date].filter((t) => t!== time);
      if(filteredTimes.length === 0){
        // Xóa hết suất trong ngày này → xóa luôn key date
        const {[date]: _,...rest} = prev;
        return rest; // ✅ FIX: return rest thay vì prev
      }
      return {
        ...prev,
        [date]: filteredTimes,
      };
    });
   };

   const handleSubmit = async () => {
    try {
      // Validate trước khi set loading
      if(!selectedMovie || !selectedHall || Object.keys(dateTimeSelection).length === 0 || !showPrice){
        toast.error('Vui lòng điền đầy đủ thông tin (phim, phòng chiếu, lịch chiếu, giá vé)');
        return;
      }
      
      setAddingShow (true);
      
      const showsInput = Object.entries(dateTimeSelection).map(([date, time]) => ({
        date,
        time,}));
      const payload = {
        movieId: selectedMovie,
        hallId: selectedHall,
        showsInput,
        showPrice: Number(showPrice),
      }
      const {data} = await axios.post('/api/show/add', payload, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if(data.success){
        toast.success(data.message || 'Chương trình được thêm thành công');
        setSelectedMovie (null);
        setSelectedHall (null);
        setDateTimeSelection({});
        setShowPrice("");
      }else{
        toast.error(data.message);
        if(data.conflicts && data.conflicts.length > 0){
          // Hiển thị chi tiết conflicts
          console.log('Conflicts:', data.conflicts);
          
          // Tạo message chi tiết cho mỗi conflict
          const conflictMessages = data.conflicts.map((conflict, index) => 
            `${index + 1}. ${conflict.requestedDate} ${conflict.requestedTime}\n   → ${conflict.reason}`
          ).join('\n\n');
          
          // Show toast với chi tiết
          toast.error(
            `Phát hiện xung đột lịch chiếu:\n\n${conflictMessages}`,
            { duration: 8000 }
          );
        }
      }
    } catch (error) {
      console.error("Lỗi khi thêm chương trình",error);
      toast.error ('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setAddingShow (false);
    }
   }
  useEffect(()=> {
    if(user){
      fetchNowPlayingMovies();
      fetchUpcomingMovies();
      fetchCinemaHalls();
    }
  },[user]);

  // Get current movies list based on active tab
  const currentMovies = activeTab === 'now-playing' ? nowPlayingMovies : upcomingMovies;

  return (nowPlayingMovies.length > 0 || upcomingMovies.length > 0) ?  (
    <>
      <Title text1=" Thêm " text2="Chương trình" />
      
      {/* Tabs */}
      <div className="mt-10 flex items-center gap-4 border-b border-gray-700">
        <button
          onClick={() => {
            setActiveTab('now-playing');
            setSelectedMovie(null);
          }}
          className={`px-6 py-3 font-medium transition-all relative ${
            activeTab === 'now-playing'
              ? 'text-primary'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Phim đang chiếu
          {activeTab === 'now-playing' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
          {nowPlayingMovies.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
              {nowPlayingMovies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('upcoming');
            setSelectedMovie(null);
          }}
          className={`px-6 py-3 font-medium transition-all relative ${
            activeTab === 'upcoming'
              ? 'text-primary'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Phim sắp khởi chiếu
          {activeTab === 'upcoming' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
          {upcomingMovies.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
              {upcomingMovies.length}
            </span>
          )}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-medium">
          {activeTab === 'now-playing' ? 'Phim đang phát' : 'Phim sắp khởi chiếu'}
        </p>
        <p className="text-sm text-gray-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hover vào phim để xem thời lượng
        </p>
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {currentMovies.map((movie) => (
            <div key={movie.id} className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 group/movie`} 
            onClick={() => setSelectedMovie(movie.id)}>
              <div className="relative rounded-lg overflow-hidden">
                <img src={image_base_url + movie.poster_path} alt="" className="w-full object-cover brightness-90" />
                
                {/* Badge cho phim sắp khởi chiếu */}
                {activeTab === 'upcoming' && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-semibold px-2 py-1 rounded">
                    SẮP CHIẾU
                  </div>
                )}
                
                {/* Runtime Tooltip */}
                {movie.runtime && (
                  <div className="absolute top-2 left-2 opacity-0 group-hover/movie:opacity-100 transition-opacity duration-200 z-10">
                    <div className="bg-black/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-primary/50 shadow-xl min-w-[140px]">
                      <p className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {movie.runtime} phút
                      </p>
                      <div className="mt-1.5 pt-1.5 border-t border-gray-700">
                        <p className="text-[10px] text-gray-400">
                          + 30 phút buffer
                        </p>
                        <p className="text-[11px] text-primary font-semibold mt-0.5">
                          ≈ {movie.runtime + 30} phút tổng
                        </p>
                      </div>
                      {movie.genres && movie.genres.length > 0 && (
                        <p className="text-gray-400 text-[10px] mt-1.5 pt-1.5 border-t border-gray-700">
                          {movie.genres.slice(0, 2).map(g => g.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                  <p className="flex items-center gap-1 text-gray-400">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {movie.vote_average.toFixed(1)}
                  </p>
                  <p className="text-gray-300">
                  {kConverter(movie.vote_count)} Bình chọn</p>
                </div>
              </div>
              {selectedMovie === movie.id && (
                <div className="absolute top-2  right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5}/>          
                </div>
              )}
              <p className="font-medium truncate">{movie.title}</p>
              <p className="text-gray-400 text-sm">{movie.release_date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cinema Hall Selection */}
      <div className="mt-8">
        <p className="text-lg font-medium mb-4">Chọn phòng chiếu</p>
        <div className="flex flex-wrap gap-4">
          {cinemaHalls.map((hall) => {
            const isMaintenance = hall.status === 'maintenance';
            const isInactive = hall.status === 'inactive';
            const isDisabled = isMaintenance || isInactive;
            
            return (
              <div 
                key={hall._id} 
                onClick={() => !isDisabled && setSelectedHall(hall._id)}
                className={`relative px-6 py-4 rounded-lg border-2 transition-all ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed border-gray-700 bg-gray-900/50'
                    : selectedHall === hall._id 
                      ? 'border-primary bg-primary/10 cursor-pointer' 
                      : 'border-gray-600 hover:border-primary/50 cursor-pointer'
                }`}
              >
                {selectedHall === hall._id && !isDisabled && (
                  <div className="absolute top-2 right-2 bg-primary h-5 w-5 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-white" strokeWidth={3}/>
                  </div>
                )}
                
                {/* Badge trạng thái */}
                {isMaintenance && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-1 rounded">
                    BẢO TRÌ
                  </div>
                )}
                {isInactive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-1 rounded">
                    VÔ HIỆU
                  </div>
                )}
                
                <h3 className={`font-semibold text-base ${isDisabled ? 'text-gray-500' : ''}`}>
                  {hall.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{hall.type}</p>
                <p className="text-sm text-gray-400">{hall.totalSeats} ghế</p>
                
                {isMaintenance && hall.maintenanceNote && (
                  <p className="text-xs text-orange-400 mt-2 line-clamp-1">
                    💬 {hall.maintenanceNote}
                  </p>
                )}
                
                {hall.priceMultiplier > 1 && !isDisabled && (
                  <span className="inline-block mt-2 px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    x{hall.priceMultiplier} giá
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">Giá hiển thị (VND)</label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md ">
          <p className="text-gray-400 text-sm">₫</p>
          <input min={0} type="number" value={showPrice} onChange={(e) => setShowPrice(e.target.value)} placeholder="Nhập giá hiển thị" className="outline-none" />
        </div>
      </div>
      <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Chọn ngày và giờ</label>
          <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
            <input type="datetime-local"  value={dateTimeInput} onChange={(e) => setDateTimeInput(e.target.value)} className="outline-none rounded-md"/>
            <button onClick={handleDateTimeAdd} className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer " > Thêm thời gian </button>
          </div>
      </div>
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-semibold">Ngày-giờ đã chọn</h2>
          <ul className="space-y-4">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium text-gray-300 mb-2">📅 {date}</div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {times.map((time) => {
                    // Tính thời gian kết thúc dự kiến
                    const selectedMovieData = currentMovies.find(m => m.id === selectedMovie);
                    const runtime = selectedMovieData?.runtime || 0;
                    const totalDuration = runtime + 30; // +30 phút buffer
                    
                    // Parse time và tính end time
                    const [hours, minutes] = time.split(':').map(Number);
                    const startDate = new Date();
                    startDate.setHours(hours, minutes, 0, 0);
                    const endDate = new Date(startDate.getTime() + totalDuration * 60000);
                    const endTime = endDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
                    
                    return (
                      <div key={time} className="border border-primary/50 bg-primary/5 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{time}</span>
                          {runtime > 0 && (
                            <>
                              <span className="text-gray-500">→</span>
                              <span className="text-xs text-gray-400">{endTime}</span>
                              <span className="text-[10px] text-gray-500">({totalDuration}')</span>
                            </>
                          )}
                          <DeleteIcon 
                            onClick={() => handleRemoveTime(date,time)} 
                            width={15} 
                            className="ml-1 text-red-500 hover:text-red-700 cursor-pointer transition" 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={handleSubmit} disabled={addingShow} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer">
        Thêm chương trình
      </button>
    </>
  ) : <Loading />
}
export default AddShows 
