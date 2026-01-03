import React, { useEffect, useState, useMemo } from 'react';
import { dummyShowsData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { vndFormat } from '../../lib/currencyFormat';
import isoTimeFormat from '../../lib/isoTimeFormat';
import { useAppContext } from '../../context/AppContext';
import { Filter } from 'lucide-react';

const ListShows = () => {

  const {axios, getToken, user} = useAppContext();

  const [shows, setShows] = useState ([]);
  const[loading, setLoading] = useState(true);
  
  // Filter states
  const [movieFilter, setMovieFilter] = useState('all');
  const [hallFilter, setHallFilter] = useState('all');
  
  const getAllShows = async () =>{
    try {
      const {data} = await axios.get('/api/admin/all-shows', {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      setShows(data.shows);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }
  
  useEffect (()=>{
    if(user){
      getAllShows();
    }
  },[user]);

  // Get unique movies and halls for filter dropdowns
  const uniqueMovies = useMemo(() => {
    const movies = shows
      .map(s => s.movie)
      .filter(movie => movie && movie.title);
    return [...new Map(movies.map(m => [m._id, m])).values()];
  }, [shows]);

  const uniqueHalls = useMemo(() => {
    const halls = shows
      .map(s => s.hall)
      .filter(hall => hall && hall.name);
    return [...new Map(halls.map(h => [h._id, h])).values()];
  }, [shows]);

  // Filter shows based on criteria
  const filteredShows = useMemo(() => {
    return shows.filter(show => {
      // Movie filter
      if (movieFilter !== 'all' && show.movie?._id !== movieFilter) return false;

      // Hall filter
      if (hallFilter !== 'all' && show.hall?._id !== hallFilter) return false;

      return true;
    });
  }, [shows, movieFilter, hallFilter]);
  return !loading ? (
    <>
      <Title text1="" text2="Danh sách chương trình" />
      
      {/* Filters */}
      <div className="max-w-4xl mt-6 mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-gray-300">Lọc:</span>
        </div>
        
        {/* Movie Filter */}
        <select
          value={movieFilter}
          onChange={(e) => setMovieFilter(e.target.value)}
          className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white text-sm [&>option]:bg-black [&>option]:text-white"
        >
          <option value="all" className="bg-black text-white">Tất cả phim</option>
          {uniqueMovies.map(movie => (
            <option key={movie._id} value={movie._id} className="bg-black text-white">
              {movie.title}
            </option>
          ))}
        </select>

        {/* Hall Filter */}
        <select
          value={hallFilter}
          onChange={(e) => setHallFilter(e.target.value)}
          className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white text-sm [&>option]:bg-black [&>option]:text-white"
        >
          <option value="all" className="bg-black text-white">Tất cả phòng</option>
          {uniqueHalls.map(hall => (
            <option key={hall._id} value={hall._id} className="bg-black text-white">
              {hall.name} (Phòng {hall.hallNumber})
            </option>
          ))}
        </select>

        {/* Reset Filter */}
        {(movieFilter !== 'all' || hallFilter !== 'all') && (
          <button
            onClick={() => {
              setMovieFilter('all');
              setHallFilter('all');
            }}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Tên phim</th>
              <th className="p-2 font-medium">Phòng chiếu</th>
              <th className="p-2 font-medium">Thời gian hiển thị</th>
              <th className="p-2 font-medium">Tổng số lượng đặt chỗ</th>
              <th className="p-2 font-medium">Thu nhập</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {filteredShows.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">
                  Không tìm thấy suất chiếu nào
                </td>
              </tr>
            ) : (
              filteredShows.map((show , index)=> (
                <tr key={index} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10" >
                  <td className="p-2 min-w-45 pl-5">{show.movie?.title || 'N/A'}</td>
                  <td className="p-2">
                    {show.hall ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{show.hall.name}</span>
                        <span className="text-xs text-gray-400">Phòng {show.hall.hallNumber} - {show.hall.type}</span>
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span>{dateFormat(show.showDateTime)}</span>
                      <span className="text-xs text-gray-400">{isoTimeFormat(show.showDateTime)}</span>
                    </div>
                  </td>
                  <td className="p-2">{Object.keys(show.occupiedSeats || {}).length}</td>
                  <td className="p-2">{vndFormat(Object.keys(show.occupiedSeats || {}).length * (show.showPrice || 0))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
    </>
  ) : <Loading />
}
export default ListShows 
