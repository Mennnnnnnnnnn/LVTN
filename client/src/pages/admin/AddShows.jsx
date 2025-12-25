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
        const {[date]: _,...rest} = prev;
        return prev;
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
        toast.error (data.message);
        if(data.conflicts){
          console.log('Conflicts:', data.conflicts);
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
      fetchCinemaHalls();
    }
  },[user]);

  return nowPlayingMovies.length > 0 ?  (
    <>
      <Title text1=" Thêm " text2="Chương trình" />
      <p className="mt-10 text-lg font-medium">Phim đang phát</p>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => (
            <div key={movie.id} className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`} 
            onClick={() => setSelectedMovie(movie.id)}>
              <div className="relative rounded-lg overflow-hidden">
                <img src={image_base_url + movie.poster_path} alt="" className="w-full object-cover brightness-90" />
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
          {cinemaHalls.map((hall) => (
            <div 
              key={hall._id} 
              onClick={() => setSelectedHall(hall._id)}
              className={`relative cursor-pointer px-6 py-4 rounded-lg border-2 transition-all ${
                selectedHall === hall._id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-600 hover:border-primary/50'
              }`}
            >
              {selectedHall === hall._id && (
                <div className="absolute top-2 right-2 bg-primary h-5 w-5 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-white" strokeWidth={3}/>
                </div>
              )}
              <h3 className="font-semibold text-base">{hall.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{hall.type}</p>
              <p className="text-sm text-gray-400">{hall.totalSeats} ghế</p>
              {hall.priceMultiplier > 1 && (
                <span className="inline-block mt-2 px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                  x{hall.priceMultiplier} giá
                </span>
              )}
            </div>
          ))}
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
          <h2 className="mb-2">Ngày-giờ đã chọn</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div key={time} className="border border-primary px-2 py-1 flex items-center rounded">
                      <span>{time}</span>
                      <DeleteIcon onClick={() => handleRemoveTime(date,time)} width={15} className="ml-2 text-red-500 hover:text-red-700 cursor-pointer" />
                    </div>
                  ))}
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
