import React, { useEffect, useState } from 'react';
import { dummyDashboardData } from '../../assets/assets';
import Loading from '../../components/Loading';
import BlurCircle from '../../components/BlurCircle';
import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UsersIcon } from 'lucide-react';
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
  
  const dashboardCards = [
    {title: "Tổng số lượng đặt chỗ" , value: dashboardData.totalBookings || "0", icon : ChartLineIcon},
    {title: "Tổng doanh thu" , value: vndFormat(dashboardData.totalRevenue || 0), icon : CircleDollarSignIcon},
    {title: "Chương trình đang hoạt động" , value: dashboardData.activeShows.length || "0", icon : PlayCircleIcon},
    {title: "Tổng số người dùng" , value: dashboardData.totalUser || "0", icon : UsersIcon},
  ]
  const fetchDashboardData = async() => {
    try {
      const {data} = await axios.get('/api/admin/dashboard', {
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
      fetchDashboardData();
    }
  },[user]);
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
