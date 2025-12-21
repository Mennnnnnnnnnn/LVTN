import React, { useEffect, useState } from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import {assets, dummyDateTimeData, dummyShowsData} from '../assets/assets'
import Loading from '../components/Loading';
import { ArrowRightIcon, ClockIcon } from 'lucide-react';
import isoTimeFormat from '../lib/isoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
const SeatLayout = () => {

  const groupRows = [["A" , "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]
  const {id, date} = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  
  const [occupiedSeats, setOccupiedSeats] = useState([])

  const navigate = useNavigate()

  const { axios, getToken, user} = useAppContext();
  const getShow = async () =>{
    try {
      const {data} = await axios.get(`/api/show/${id}`);
      if(data.success){
        setShow(data);
      }
    } catch (error) {
      console.log(error)
    }
  }

const TOTAL_SEATS_PER_ROW = 9;

const parseSeat = (seatId) => ({
  row: seatId[0],
  num: parseInt(seatId.slice(1)),
});

const validateSeatRules = (selectedSeats) => {
  const map = {};

  // Gom ghế theo hàng
  selectedSeats.forEach(seat => {
    const { row, num } = parseSeat(seat);
    if (!map[row]) map[row] = [];
    map[row].push(num);
  });

  for (const row in map) {
    const nums = map[row].sort((a, b) => a - b);

    const min = nums[0];
    const max = nums[nums.length - 1];

    // ❌ Trống đúng 1 ghế bên trái
    if (min > 1 && min - 1 === 1) {
      return {
        valid: false,
        message: `Không được bỏ trống ghế ${row}${min - 1} bên trái`
      };
    }

    // ❌ Trống đúng 1 ghế bên phải
    if (max < TOTAL_SEATS_PER_ROW && TOTAL_SEATS_PER_ROW - max === 1) {
      return {
        valid: false,
        message: `Không được bỏ trống ghế ${row}${max + 1} bên phải`
      };
    }

    // ❌ Trống đúng 1 ghế ở giữa
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i + 1] - nums[i] === 2) {
        return {
          valid: false,
          message: `Không được bỏ trống ghế ${row}${nums[i] + 1} giữa ${row}${nums[i]} và ${row}${nums[i + 1]}`
        };
      }
    }
  }

  return { valid: true };
};



  const handleSeatClick = (seatId) => {
    if(!selectedTime){
      return toast("Vui lòng chọn thời gian trước")
    }
    if(!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
        return toast("Bạn có thể chọn 5 ghế ngồi")
    }
    if(occupiedSeats.includes(seatId)){
      return toast("Ghế đã được đặt trước đó")
    }
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !== seatId) : [...prev , seatId] )
  }
  const renderSeats = (row, count = 9 )=> (
    <div key={row} className="flex gap-2 mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({length: count}, (_,i)=>{
          const seatId = `${row}${i+1}`;
          return (
            <button key={seatId} onClick={()=> handleSeatClick(seatId)}
             className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${selectedSeats.includes(seatId) && "bg-primary text-white"}
             ${occupiedSeats.includes(seatId) && "opacity-50"}`}>
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  )

  const getOccupiedSeats = async () => {
    try {
      const {data} = await axios.get(`/api/booking/seats/${selectedTime.showId}`);
      if(data.success){
        setOccupiedSeats(data.occupiedSeats);
      }else{
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error)
    }
  }
  const bookTickets = async () => {
    try {
      if(!user){
        return toast.error("Vui lòng đăng nhập để đặt vé")
      }
      if(!selectedTime || !selectedSeats.length){
        return toast.error("Vui lòng chọn thời gian và ghế ngồi")
      }
      // 🚨 CHECK RÀNG BUỘC GHẾ
      const validation = validateSeatRules(selectedSeats);
      if (!validation.valid) {
        return toast.error(validation.message);
      }
      const {data} = await axios.post('/api/booking/create', {
        showId: selectedTime.showId,
        selectedSeats}, {        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });
      if(data.success){
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(()=>{
    getShow()
  },[])

  useEffect(()=>{
    if(selectedTime){
      getOccupiedSeats()
    }
  },[selectedTime])

  return show ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
      {/* thoi gian co san */}
      <div className='w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30'>
      <p className='flex-lg font-semibold px-6'>Thời gian có sẵn</p>
      <div className='mt-5 space-y-1'>
        {show.dateTime[date].map((item)=>(
          <div key={item.time} onClick={()=> setSelectedTime(item)} className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${selectedTime?.time === item.time ?
          "bg-primary text-white" : "hover:bg-primary/20" }`}>
            <ClockIcon className='w-4 h-4' />
            <p className='text-sm'>{ isoTimeFormat(item.time)}</p>
          </div>
        ))}
      </div>

      </div>
      {/* Bo tri cho ngoi */}
      <div className=' relative flex-1  flex flex-col items-center max-md:mt-16'>
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0px" right="0px" />
        <h1 className='text-2xl font-semibold mb-4'>Chọn chỗ ngồi của bạn</h1>
        <img src={assets.screenImage} alt="screen" />
        <p className='text-gray-400 text-sm mb-6'>Man Hinh</p>
        <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
          <div className='grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6'>
            {groupRows[0].map(row => renderSeats(row))}
          </div>
          <div className='grid grid-cols-2 gap-11'>
            {groupRows.slice(1).map((group, idx)=>(
              <div key={idx}>
                {group.map(row => renderSeats(row))}
              </div>
            ))}
          </div>
        </div>
        <button onClick={bookTickets} className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'>
          Thanh toán
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>        
      </div>
    </div>
  ) : (
    <Loading />
  )
}
export default SeatLayout