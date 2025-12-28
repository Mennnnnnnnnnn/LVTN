import React, { useEffect, useState, useMemo } from 'react';
import { dummyBookingData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { vndFormat } from '../../lib/currencyFormat';
import { useAppContext } from '../../context/AppContext';
import { Search } from 'lucide-react';

const ListBookings = () => {

  const {axios, getToken, user} = useAppContext();

  const [bookings, setBookings] = useState ([]);
  const[isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', 'today', '7days', '30days'
  const [movieFilter, setMovieFilter] = useState('all');
  const [hallFilter, setHallFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const getAllBookings = async ()=>{
    try {
      const {data} = await axios.get('/api/admin/all-bookings', {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if(data && data.bookings){
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
    setIsLoading (false);
  };

  useEffect(()=>{
    if(user){
      getAllBookings();
    }
  },[user]);

  // Get unique movies and halls for filter dropdowns
  const uniqueMovies = useMemo(() => {
    const movies = bookings
      .map(b => b.show?.movie)
      .filter(movie => movie && movie.title);
    return [...new Map(movies.map(m => [m._id, m])).values()];
  }, [bookings]);

  const uniqueHalls = useMemo(() => {
    const halls = bookings
      .map(b => b.show?.hall)
      .filter(hall => hall && hall.name);
    return [...new Map(halls.map(h => [h._id, h])).values()];
  }, [bookings]);

  // Filter bookings based on all criteria
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Payment status filter
      if (paymentFilter === 'paid' && !booking.ispaid) return false;
      if (paymentFilter === 'unpaid' && booking.ispaid) return false;

      // Date range filter (based on booking creation date)
      if (dateRangeFilter !== 'all') {
        const bookingDate = new Date(booking.createdAt);
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        
        if (dateRangeFilter === 'today') {
          if (bookingDate < today) return false;
        } else if (dateRangeFilter === '7days') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (bookingDate < sevenDaysAgo) return false;
        } else if (dateRangeFilter === '30days') {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (bookingDate < thirtyDaysAgo) return false;
        }
      }

      // Movie filter
      if (movieFilter !== 'all' && booking.show?.movie?._id !== movieFilter) return false;

      // Hall filter
      if (hallFilter !== 'all' && booking.show?.hall?._id !== hallFilter) return false;

      // Search query (customer name)
      if (searchQuery) {
        const userName = booking.user?.name || booking.user || '';
        if (!userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }

      return true;
    });
  }, [bookings, paymentFilter, dateRangeFilter, movieFilter, hallFilter, searchQuery]);

  return !isLoading ? (
    <>
      <Title text1="" text2="Danh sách đặt chỗ" />

      {/* Filter Section */}
      <div className="mt-6 mb-6 space-y-4">
        {/* Search Box */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Trạng thái:</label>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-primary transition"
            >
              <option value="all">Tất cả</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thanh toán</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Thời gian:</label>
            <select 
              value={dateRangeFilter} 
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-primary transition"
            >
              <option value="all">Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>

          {/* Movie Filter */}
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Phim:</label>
            <select 
              value={movieFilter} 
              onChange={(e) => setMovieFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-primary transition"
            >
              <option value="all">Tất cả phim</option>
              {uniqueMovies.map(movie => (
                <option key={movie._id} value={movie._id}>{movie.title}</option>
              ))}
            </select>
          </div>

          {/* Hall Filter */}
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Phòng chiếu:</label>
            <select 
              value={hallFilter} 
              onChange={(e) => setHallFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-primary transition"
            >
              <option value="all">Tất cả phòng</option>
              {uniqueHalls.map(hall => (
                <option key={hall._id} value={hall._id}>{hall.name}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="ml-auto text-gray-400 text-sm">
            Hiển thị: <span className="text-white font-medium">{filteredBookings.length}</span> / {bookings.length} đặt chỗ
          </div>
        </div>
      </div>

      {filteredBookings && filteredBookings.length > 0 ? (
        <div className="w-full mt-6 overflow-x-auto">
          <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Tên người dùng</th>
              <th className="p-2 font-medium">Tên phim</th>
              <th className="p-2 font-medium">Phòng chiếu</th>
              <th className="p-2 font-medium">Thời gian phim</th>
              <th className="p-2 font-medium">Chỗ ngồi</th>
              <th className="p-2 font-medium">Số lượng</th>
              <th className="p-2 font-medium">Tổng tiền</th>
              <th className="p-2 font-medium">Trạng thái</th>
            </tr>
          </thead>
            <tbody className="text-sm font-light">
              {filteredBookings.map((item , index)=> (
                  <tr key={index} className="border-b border-primary/20 bg-primary/5 even:bg-primary/10" >
                    <td className="p-2 min-w-45 pl-5">{item.user?.name || item.user || 'N/A'}</td>
                    <td className="p-2">{item.show?.movie?.title || 'N/A'}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                        {item.show?.hall?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2">{item.show?.showDateTime ? dateFormat(item.show.showDateTime) : 'N/A'}</td>
                    <td className="p-2">{item.bookedSeats ? Object.keys(item.bookedSeats).map(seat => item.bookedSeats[seat]).join(", ") : 'N/A'}</td>
                    <td className="p-2">{item.bookedSeats ? Object.keys(item.bookedSeats).length : 0} vé</td>
                    <td className="p-2">{vndFormat(item.amount || 0)}</td>
                    <td className="p-2">
                      {item.ispaid ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Chưa thanh toán
                        </span>
                      )}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center mt-10 py-10 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-gray-400 text-lg">
            {bookings.length === 0 
              ? 'Chưa có đặt chỗ nào' 
              : 'Không tìm thấy đặt chỗ phù hợp với bộ lọc'}
          </p>
          {filteredBookings.length === 0 && bookings.length > 0 && (
            <button
              onClick={() => {
                setPaymentFilter('all');
                setDateRangeFilter('all');
                setMovieFilter('all');
                setHallFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-md text-sm font-medium"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </>
  ) : <Loading />
}
export default ListBookings 
