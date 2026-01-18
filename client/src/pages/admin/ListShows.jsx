import React, { useEffect, useState, useMemo } from 'react';
import { dummyShowsData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { vndFormat } from '../../lib/currencyFormat';
import isoTimeFormat from '../../lib/isoTimeFormat';
import { useAppContext } from '../../context/AppContext';
import { Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ListShows = () => {

  const {axios, getToken, user} = useAppContext();

  const [shows, setShows] = useState ([]);
  const[loading, setLoading] = useState(true);
  
  // Filter states
  const [movieFilter, setMovieFilter] = useState('all');
  const [hallFilter, setHallFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const getAllShows = async () =>{
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const {data} = await axios.get('/api/admin/all-shows', {
        params,
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
  },[user, statusFilter]);

  const handleCancelShow = async (showId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy chương trình này?')) {
      return;
    }

    try {
      const {data} = await axios.delete(`/api/admin/cancel-show/${showId}`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });

      if (data.success) {
        toast.success(data.message || 'Hủy chương trình thành công');
        // Refresh the list
        getAllShows();
      } else {
        toast.error(data.message || 'Không thể hủy chương trình');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy chương trình');
    }
  };

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
      <div className="w-full mt-6 mb-4 flex flex-wrap gap-4 items-center">
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white text-sm [&>option]:bg-black [&>option]:text-white"
        >
          <option value="all" className="bg-black text-white">Tất cả trạng thái</option>
          <option value="upcoming" className="bg-black text-white">Sắp chiếu</option>
          <option value="active" className="bg-black text-white">Đang chiếu</option>
          <option value="completed" className="bg-black text-white">Đã hoàn thành</option>
          <option value="cancelled" className="bg-black text-white">Đã hủy</option>
        </select>

        {/* Reset Filter */}
        {(movieFilter !== 'all' || hallFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setMovieFilter('all');
              setHallFilter('all');
              setStatusFilter('all');
            }}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="w-full mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden min-w-[800px]">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5 min-w-[150px]">Tên phim</th>
              <th className="p-2 font-medium min-w-[120px]">Phòng chiếu</th>
              <th className="p-2 font-medium min-w-[140px]">Thời gian</th>
              <th className="p-2 font-medium min-w-[100px]">Trạng thái</th>
              <th className="p-2 font-medium min-w-[100px] text-center">Đặt chỗ</th>
              <th className="p-2 font-medium min-w-[110px] text-right">Thu nhập</th>
              <th className="p-2 font-medium min-w-[90px] text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {filteredShows.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400">
                  Không tìm thấy suất chiếu nào
                </td>
              </tr>
            ) : (
              filteredShows.map((show , index)=> (
                <tr key={index} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10" >
                  <td className="p-2 pl-5">
                    <span className="line-clamp-2">{show.movie?.title || 'N/A'}</span>
                  </td>
                  <td className="p-2">
                    {show.hall ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{show.hall.name}</span>
                        <span className="text-xs text-gray-400">Phòng {show.hall.hallNumber} - {show.hall.type}</span>
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col whitespace-nowrap">
                      <span className="text-sm">{dateFormat(show.showDateTime)}</span>
                      <span className="text-xs text-gray-400">{isoTimeFormat(show.showDateTime)}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      show.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                      show.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      show.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                      show.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {show.status === 'upcoming' ? 'Sắp chiếu' :
                       show.status === 'active' ? 'Đang chiếu' :
                       show.status === 'completed' ? 'Đã hoàn thành' :
                       show.status === 'cancelled' ? 'Đã hủy' :
                       show.status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-2 text-center">{Object.keys(show.occupiedSeats || {}).length}</td>
                  <td className="p-2 text-right whitespace-nowrap">{vndFormat(Object.keys(show.occupiedSeats || {}).length * (show.showPrice || 0))}</td>
                  <td className="p-2 text-center">
                    {show.status !== 'cancelled' && show.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelShow(show._id)}
                        className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                        title="Hủy chương trình"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden md:inline">Hủy</span>
                      </button>
                    )}
                  </td>
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
