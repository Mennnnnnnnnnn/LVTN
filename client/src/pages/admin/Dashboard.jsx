import React, { useEffect, useState } from 'react';
import { dummyDashboardData } from '../../assets/assets';
import Loading from '../../components/Loading';
import BlurCircle from '../../components/BlurCircle';
import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UsersIcon, Filter } from 'lucide-react';
import Title from '../../components/admin/Title';
import {dateFormat} from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext.jsx';
import { vndFormat } from '../../lib/currencyFormat';
import toast from 'react-hot-toast';

const Dashboard = () => {

  const {axios, getToken, user, image_base_url} = useAppContext();

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0
  });
  const[loading, setLoading] = useState(true);
  const[updatingTrailers, setUpdatingTrailers] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const dashboardCards = [
    {title: "Tổng số lượng đặt chỗ" , value: dashboardData.totalBookings || "0", icon : ChartLineIcon},
    {title: "Tổng doanh thu" , value: vndFormat(dashboardData.totalRevenue || 0), icon : CircleDollarSignIcon},
    {title: "Chương trình đang hoạt động" , value: dashboardData.activeShows.length || "0", icon : PlayCircleIcon},
    {title: "Tổng số người dùng" , value: dashboardData.totalUser || "0", icon : UsersIcon},
  ]
  const fetchDashboardData = async() => {
    try {
      let url = `/api/admin/dashboard?period=${timeFilter}`;
      
      // Add custom date range if selected
      if (timeFilter === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const {data} = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if(data.success){
        setDashboardData(data.dashboardData);
        setLoading(false);
      }else{
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu bảng điều khiển",error);
    }
  };
  
  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
    if (value === 'custom') {
      setShowCustomDateRange(true);
    } else {
      setShowCustomDateRange(false);
      setStartDate('');
      setEndDate('');
    }
  };
  
  const handleApplyCustomDate = () => {
    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Ngày bắt đầu không thể lớn hơn ngày kết thúc');
      return;
    }
    fetchDashboardData();
  };

  const handleUpdateTrailers = async() => {
    try {
      setUpdatingTrailers(true);
      const {data} = await axios.post('/api/admin/update-trailers', {}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if(data.success){
        toast.success(`Đã cập nhật ${data.updatedCount} phim với trailer!`);
      }else{
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật trailers");
      console.error(error);
    } finally {
      setUpdatingTrailers(false);
    }
  };

  useEffect (()=> {
    if(user){
      // Auto-fetch for predefined periods
      if (timeFilter !== 'custom') {
        fetchDashboardData();
      }
      // For custom, only fetch if both dates are selected
      else if (timeFilter === 'custom' && startDate && endDate) {
        fetchDashboardData();
      }
    }
  },[user, timeFilter, startDate, endDate]);
  return !loading ? (
    <>
      <Title text2="Trang tổng quan" />
      
      {/* Update Trailers Button */}
      <div className="mt-4">
        <button
          onClick={handleUpdateTrailers}
          disabled={updatingTrailers}
          className={`px-6 py-2.5 bg-primary hover:bg-primary-dull transition rounded-md font-medium text-sm ${
            updatingTrailers ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
          }`}
        >
          {updatingTrailers ? 'Đang cập nhật trailers...' : 'Cập nhật Trailers cho tất cả phim'}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          * Sử dụng nút này để cập nhật trailer cho các phim hiện có trong database
        </p>
      </div>

      {/* Time Filter */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-gray-300">Lọc thời gian:</span>
          </div>
          <select
            value={timeFilter}
            onChange={(e) => handleTimeFilterChange(e.target.value)}
            className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white text-sm [&>option]:bg-black [&>option]:text-white"
          >
            <option value="all" className="bg-black text-white">Tất cả thời gian</option>
            <option value="today" className="bg-black text-white">Hôm nay</option>
            <option value="thisMonth" className="bg-black text-white">Tháng này</option>
            <option value="lastMonth" className="bg-black text-white">Tháng trước</option>
            <option value="last3Months" className="bg-black text-white">3 tháng qua</option>
            <option value="last6Months" className="bg-black text-white">6 tháng qua</option>
            <option value="thisYear" className="bg-black text-white">Năm này</option>
            <option value="lastYear" className="bg-black text-white">Năm trước</option>
            <option value="custom" className="bg-black text-white">Tùy chỉnh</option>
          </select>
        </div>
        
        {/* Custom Date Range Picker */}
        {showCustomDateRange && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white text-sm"
              />
            </div>
            <button
              onClick={handleApplyCustomDate}
              className="px-6 py-2 bg-primary hover:bg-primary-dull transition rounded-lg font-medium text-sm"
            >
              Áp dụng
            </button>
          </div>
        )}
      </div>

      <div className="relative flex flex-wrap gap-4 mt-6">
        <BlurCircle top="-100px" left="0px" />
        <div className="flex flex-wrap gap-4 w-full">
          {dashboardCards.map((card , index) =>(
            <div key={index} className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full">
              <div>
                <h1 className="text-sm">{card.title}</h1>
                <p className="text-xl font-medium mt-1">{card.value}</p>
              </div>
              <card.icon className="w-6 h-6" />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-10 text-lg font-medium">Chương trình đang hoạt động</p>
      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />
        {dashboardData.activeShows.map((show) => (
          <div key={show._id} className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300">
            <img src={image_base_url + show.movie.poster_path} alt='' className="h-60 w-full object-cover" />
            <p className="font-medium p-2 truncate">{show.movie.title}</p>
            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-medium">{vndFormat(show.showPrice)}</p>
              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>
            <p className="px-2 pt-2 text-sm text-gray-500">{dateFormat(show.showDateTime)}</p>
          </div>
        ))}
      </div>
    </>
  ) : <Loading />
}
export default Dashboard 
