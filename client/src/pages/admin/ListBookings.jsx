import React, { useEffect, useState, useMemo } from 'react';
import { dummyBookingData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { vndFormat } from '../../lib/currencyFormat';
import { useAppContext } from '../../context/AppContext';
import { Search, Info, X } from 'lucide-react';
import { formatDateTime } from '../../lib/datetimeFormat';

const ListBookings = () => {

  const {axios, getToken, user} = useAppContext();

  const [bookings, setBookings] = useState ([]);
  const[isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'cancelled'
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', 'today', '7days', '30days'
  const [movieFilter, setMovieFilter] = useState('all');
  const [hallFilter, setHallFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for booking details
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

      // Booking status filter (active/cancelled)
      if (statusFilter === 'active' && booking.status === 'cancelled') return false;
      if (statusFilter === 'cancelled' && booking.status !== 'cancelled') return false;

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
  }, [bookings, paymentFilter, statusFilter, dateRangeFilter, movieFilter, hallFilter, searchQuery]);

  // Format time duration in a human-readable way
  const formatTimeDuration = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else {
      return `${minutes} phút`;
    }
  };


  const handleInfoClick = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

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
            <label className="text-gray-400 text-sm">Thanh toán:</label>
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

          {/* Booking Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Trạng thái vé:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-primary transition"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="cancelled">Đã hủy</option>
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
              <th className="p-2 font-medium">Thanh toán</th>
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
                    <td className="p-2">
                      {item.status === 'cancelled' && item.refundAmount ? (
                        <div className="flex flex-col">
                          <span className="line-through text-gray-500">{vndFormat(item.amount || 0)}</span>
                          <span className="text-green-400 text-xs">Hoàn: {vndFormat(item.refundAmount)} ({item.refundPercentage}%)</span>
                        </div>
                      ) : (
                        vndFormat(item.amount || 0)
                      )}
                    </td>
                    <td className="p-2">
                      {item.ispaid ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Đã TT
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Chưa TT
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {item.status === 'cancelled' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Đã hủy
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Hoạt động
                          </span>
                        )}
                        <button
                          onClick={() => handleInfoClick(item)}
                          className="p-1.5 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                          title="Xem thông tin chi tiết"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
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
                setStatusFilter('all');
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

      {/* Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Thông tin chi tiết đặt chỗ</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Booking Time */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Thời gian đặt vé</h3>
                <p className="text-white text-lg">
                  {selectedBooking.createdAt ? formatDateTime(selectedBooking.createdAt) : 'N/A'}
                </p>
              </div>

              {/* Show Time */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Giờ chiếu suất chiếu</h3>
                <p className="text-white text-lg">
                  {selectedBooking.show?.showDateTime ? formatDateTime(selectedBooking.show.showDateTime) : 'N/A'}
                </p>
              </div>

              {/* Cancellation Info (if cancelled) */}
              {selectedBooking.status === 'cancelled' && selectedBooking.cancelledAt && (
                <>
                  {selectedBooking.show?.showDateTime && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-red-400 mb-3">Thống kê hủy</h3>
                      {(() => {
                        const showDateTime = new Date(selectedBooking.show.showDateTime);
                        const cancelledAt = new Date(selectedBooking.cancelledAt);
                        
                        // Time from cancellation to show
                        const timeFromCancellationToShow = showDateTime - cancelledAt;
                        const formattedTime = formatTimeDuration(timeFromCancellationToShow);
                        
                        return (
                          <div className="space-y-3">
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Thời gian người dùng hủy:</p>
                              <p className="text-white text-lg font-medium">
                                {formatDateTime(selectedBooking.cancelledAt)}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-red-500/20">
                              <p className="text-gray-400 text-sm mb-1">Thời gian từ khi hủy đến khi suất chiếu bắt đầu:</p>
                              <p className="text-white text-lg font-medium text-red-400">
                                {formattedTime}
                              </p>
                            </div>
                            {selectedBooking.refundPercentage !== undefined && selectedBooking.refundPercentage !== null && (
                              <div className="pt-2 border-t border-red-500/20">
                                <p className="text-gray-400 text-sm mb-1">Phần trăm được hoàn tiền theo chính sách:</p>
                                <p className="text-white text-lg font-medium text-red-400">
                                  {selectedBooking.refundPercentage}%
                                </p>
                                {selectedBooking.refundAmount && (
                                  <p className="text-gray-400 text-sm mt-1">
                                    Số tiền hoàn: {vndFormat(selectedBooking.refundAmount)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              {/* Additional Booking Info */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Khách hàng</h3>
                  <p className="text-white">{selectedBooking.user?.name || selectedBooking.user || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Phim</h3>
                  <p className="text-white">{selectedBooking.show?.movie?.title || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Phòng chiếu</h3>
                  <p className="text-white">{selectedBooking.show?.hall?.name || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Số lượng vé</h3>
                  <p className="text-white">
                    {selectedBooking.bookedSeats ? Object.keys(selectedBooking.bookedSeats).length : 0} vé
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-md text-sm font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : <Loading />
}
export default ListBookings 
