import React, { useEffect, useState } from 'react';
import {useNavigate, useParams} from 'react-router-dom'
import {assets, dummyDateTimeData, dummyShowsData} from '../assets/assets'
import Loading from '../components/Loading';
import { ArrowRightIcon, ClockIcon } from 'lucide-react';
import isoTimeFormat from '../lib/isoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import { vndFormat } from '../lib/currencyFormat';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
const SeatLayout = () => {

  const {id, date} = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  const [hall, setHall] = useState(null)
  const [currentShowPrice, setCurrentShowPrice] = useState(0) // Giá của show được chọn
  const [isEveningShow, setIsEveningShow] = useState(false) // Suất tối
  
  const [occupiedSeats, setOccupiedSeats] = useState([])
  
  // Constants phụ thu
  const COUPLE_SEAT_SURCHARGE = 10000; // Phụ thu ghế đôi mỗi ghế
  const EVENING_SURCHARGE = 10000; // Phụ thu suất tối mỗi ghế

  const navigate = useNavigate()

  const { axios, getToken, user} = useAppContext();
  
  // Dynamic group rows based on hall layout
  const layoutType = hall?.seatLayout?.layoutType || 'default';
  const groupRows = hall ? 
    (layoutType === 'single-column' || layoutType === 'theater-v' ?
      // Tất cả rows ở giữa (1 nhóm duy nhất)
      [hall.seatLayout.rows] :
      layoutType === 'two-columns' ?
      // Tất cả rows chia thành 2 nhóm bằng nhau (mỗi nhóm = 1 cột)
      (() => {
        const rows = hall.seatLayout.rows;
        const midPoint = Math.ceil(rows.length / 2);
        return [
          rows.slice(0, midPoint), // Cột trái: nửa đầu rows
          rows.slice(midPoint)    // Cột phải: nửa sau rows
        ];
      })() :
      // Default: 2 dãy đầu ở giữa, các dãy sau chia 2 cột, dãy cuối lẻ tự động ở giữa
      (() => {
        const rows = hall.seatLayout.rows;
        if (rows.length <= 2) {
          return [rows];
        }
        
        // 2 dãy đầu ở giữa
        const firstTwo = rows.slice(0, 2);
        const remainingRows = rows.slice(2);
        
        // Chia các dãy còn lại thành nhóm 2 dãy
        const groups = [];
        for (let i = 0; i < remainingRows.length; i += 2) {
          const group = remainingRows.slice(i, i + 2);
          groups.push(group);
        }
        
        // Nếu nhóm cuối chỉ có 1 dãy (lẻ), đưa nó vào nhóm đầu (ở giữa)
        if (groups.length > 0 && groups[groups.length - 1].length === 1) {
          const lastRow = groups.pop()[0];
          firstTwo.push(lastRow);
        }
        
        return [firstTwo, ...groups];
      })()
    ) : [];

  const TOTAL_SEATS_PER_ROW = hall ? hall.seatLayout.seatsPerRow : 9;
  const getShow = async () =>{
    try {
      const {data} = await axios.get(`/api/show/${id}`);
      if(data.success){
        setShow(data);
        if(data.hall) {
          setHall(data.hall);
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

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
    
    const row = seatId[0];
    const seatNum = parseInt(seatId.slice(1));
    
    // ⚠️ Kiểm tra ghế hỏng
    if(hall?.brokenSeats?.includes(seatId)){
      return toast.error("Ghế này đang bảo trì, không thể đặt")
    }
    
    // Kiểm tra xem dãy này có phải là ghế đôi không
    const isCoupleSeat = hall?.seatLayout?.coupleSeatsRows?.includes(row);
    
    if(isCoupleSeat) {
      // Ghế đôi: chọn/bỏ chọn cặp ghế (số lẻ-chẵn)
      const isOddSeat = seatNum % 2 === 1;
      const coupleSeat = isOddSeat ? `${row}${seatNum + 1}` : `${row}${seatNum - 1}`;
      
      // ⚠️ Kiểm tra ghế đôi hỏng
      if(hall?.brokenSeats?.includes(coupleSeat)){
        return toast.error("Ghế đôi này có ghế đang bảo trì, không thể đặt")
      }
      
      // Kiểm tra cả 2 ghế đã được đặt chưa
      if(occupiedSeats.includes(seatId) || occupiedSeats.includes(coupleSeat)){
        return toast("Ghế đôi đã được đặt trước đó")
      }
      
      // Kiểm tra giới hạn 5 ghế (tính cả ghế đôi = 2 ghế)
      if(!selectedSeats.includes(seatId) && selectedSeats.length > 3) {
        return toast("Bạn có thể chọn tối đa 5 ghế ngồi")
      }
      
      // Toggle cả 2 ghế
      if(selectedSeats.includes(seatId)) {
        setSelectedSeats(prev => prev.filter(seat => seat !== seatId && seat !== coupleSeat))
      } else {
        setSelectedSeats(prev => [...prev, seatId, coupleSeat])
      }
    } else {
      // Ghế thường: chọn/bỏ chọn từng ghế
      if(!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
        return toast("Bạn có thể chọn tối đa 5 ghế ngồi")
      }
      if(occupiedSeats.includes(seatId)){
        return toast("Ghế đã được đặt trước đó")
      }
      setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !== seatId) : [...prev , seatId] )
    }
  }
  const renderSeats = (row)=> {
    // Kiểm tra số ghế tùy chỉnh cho dãy này
    const customSeats = hall?.customRowSeats?.[row];
    const count = customSeats || TOTAL_SEATS_PER_ROW;
    
    // Kiểm tra dãy này có phải ghế đôi không
    const isCoupleSeat = hall?.seatLayout?.coupleSeatsRows?.includes(row);
    
    // Tính toán padding để căn giữa (cho dãy có ít ghế hơn)
    const needsPadding = count < TOTAL_SEATS_PER_ROW;
    const paddingSeats = needsPadding ? Math.floor((TOTAL_SEATS_PER_ROW - count) / 2) : 0;
    
    return (
      <div key={row} className="flex gap-2 mt-2 justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Padding ghế trống bên trái */}
          {needsPadding && Array.from({length: paddingSeats}, (_, i) => (
            <div key={`pad-left-${i}`} className="h-8 w-8"></div>
          ))}
          
          {/* Ghế thực tế */}
          {Array.from({length: count}, (_,i)=>{
            const seatId = `${row}${i+1}`;
            const isSelected = selectedSeats.includes(seatId);
            const isOccupied = occupiedSeats.includes(seatId);
            const isBroken = hall?.brokenSeats?.includes(seatId);
            
            // Nếu là ghế đôi, thêm style đặc biệt
            const coupleClass = isCoupleSeat ? 'border-2 border-pink-500' : 'border border-primary/60';
            
            return (
              <button key={seatId} onClick={()=> handleSeatClick(seatId)}
               className={`h-8 w-8 rounded ${coupleClass} cursor-pointer transition-all relative
               ${isSelected && !isBroken && "bg-primary text-white scale-110"}
               ${isOccupied && "opacity-30 cursor-not-allowed bg-gray-600"}
               ${isBroken && "bg-red-500/80 cursor-not-allowed text-white"}
               ${!isSelected && !isOccupied && !isBroken && "hover:bg-primary/30"}`}
               disabled={isOccupied || isBroken}
               title={isBroken ? "Ghế đang bảo trì" : isOccupied ? "Ghế đã được đặt" : seatId}>
                {isBroken ? '✕' : seatId}
              </button>
            );
          })}
          
          {/* Padding ghế trống bên phải */}
          {needsPadding && Array.from({length: paddingSeats}, (_, i) => (
            <div key={`pad-right-${i}`} className="h-8 w-8"></div>
          ))}
        </div>
      </div>
    )
  }

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
  
  // Cập nhật hall khi chọn thời gian mới
  useEffect(() => {
    if(selectedTime?.hall) {
      setHall(selectedTime.hall);
      setCurrentShowPrice(selectedTime.showPrice || show?.showPrice || 0);
      setIsEveningShow(selectedTime.isEveningShow || false);
    }
  }, [selectedTime, show]);
  
  // Reset ghế đã chọn khi chuyển suất chiếu
  useEffect(() => {
    if(selectedTime) {
      setSelectedSeats([]);
    }
  }, [selectedTime?.showId]); // Chỉ trigger khi showId thay đổi
  
  // Tính giá cuối cho mỗi ghế với phụ thu
  const calculateFinalPrice = (seatId) => {
    if(!hall || !currentShowPrice) return 0;
    
    let price = currentShowPrice;
    
    // Phụ thu ghế đôi
    const row = seatId[0];
    if(hall.seatLayout?.coupleSeatsRows?.includes(row)) {
      price += COUPLE_SEAT_SURCHARGE;
    }
    
    // Phụ thu suất tối
    if(isEveningShow) {
      price += EVENING_SURCHARGE;
    }
    
    return price;
  };
  
  // Tính tổng tiền cho tất cả ghế đã chọn
  const calculateTotalAmount = () => {
    return selectedSeats.reduce((total, seatId) => {
      return total + calculateFinalPrice(seatId);
    }, 0);
  };
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

  return show && hall ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
      {/* thoi gian co san */}
      <div className='w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30'>
      <p className='flex-lg font-semibold px-6'>Thời gian có sẵn</p>
      <div className='mt-5 space-y-1'>
        {show.dateTime[date].map((item)=>(
          <div key={item.showId} onClick={()=> setSelectedTime(item)} className={`flex flex-col gap-1 px-6 py-2 rounded-r-md cursor-pointer transition ${selectedTime?.showId === item.showId ?
          "bg-primary text-white" : "hover:bg-primary/20" }`}>
            <div className='flex items-center gap-2'>
              <ClockIcon className='w-4 h-4' />
              <p className='text-sm font-medium'>{ isoTimeFormat(item.time)}</p>
            </div>
            {item.hall && (
              <div className='flex items-center gap-2 ml-6'>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.hall.type === 'IMAX' ? 'bg-yellow-500/20 text-yellow-400' :
                  item.hall.type === 'VIP' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {item.hall.type}
                </span>
                <span className='text-xs text-gray-400'>{item.hall.name}</span>
              </div>
            )}
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
        <p className='text-gray-400 text-sm mb-6'>Màn Hình</p>
        
        {/* Chú giải */}
        <div className='flex flex-wrap items-center gap-4 mb-6 text-sm'>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 rounded border border-primary/60 bg-transparent'></div>
            <span>Ghế trống</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 rounded border-2 border-pink-500 bg-transparent'></div>
            <span>Ghế đôi</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 rounded bg-primary'></div>
            <span>Đã chọn</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 rounded bg-gray-600 opacity-30'></div>
            <span>Đã đặt</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 rounded bg-red-500 text-white flex items-center justify-center text-xs'>✕</div>
            <span>Bảo trì</span>
          </div>
        </div>
        
        <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
          {layoutType === 'two-columns' ? (
            // Render 2 cột cạnh nhau
            <div className='grid grid-cols-2 gap-11'>
              {groupRows.map((group, idx) => (
                <div key={idx}>
                  {group.map(row => renderSeats(row))}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className='grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6'>
                {groupRows[0]?.map(row => renderSeats(row))}
              </div>
              <div className='grid grid-cols-2 gap-11'>
                {groupRows.slice(1).map((group, idx)=>(
                  <div key={idx}>
                    {group.map(row => renderSeats(row))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Hiển thị tổng tiền */}
        {selectedSeats.length > 0 && currentShowPrice > 0 && (
          <div className='mt-8 w-full max-w-md'>
            <div className='bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 rounded-xl p-6 shadow-lg'>
              {/* Header */}
              <div className='flex items-center justify-between mb-4 pb-4 border-b border-primary/20'>
                <h3 className='text-lg font-semibold'>Chi tiết đặt vé</h3>
                <span className='px-3 py-1 bg-primary/20 rounded-full text-sm font-medium'>
                  {selectedSeats.length} ghế
                </span>
              </div>
              
              {/* Ghế đã chọn */}
              <div className='mb-4'>
                <p className='text-sm text-gray-400 mb-2'>Ghế đã chọn:</p>
                <div className='flex flex-wrap gap-2'>
                  {selectedSeats.map((seat, index) => {
                    const row = seat[0];
                    const isCouple = hall?.seatLayout?.coupleSeatsRows?.includes(row);
                    return (
                      <span key={index} className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                        isCouple ? 'bg-pink-500 text-white' : 'bg-primary text-white'
                      }`}>
                        {seat} {isCouple && '💑'}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              {/* Chi tiết giá */}
              <div className='space-y-2 mb-4 py-3 border-y border-primary/20'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Giá cơ bản:</span>
                  <span className='font-medium'>{vndFormat(currentShowPrice)}</span>
                </div>
                {selectedSeats.some(seat => hall?.seatLayout?.coupleSeatsRows?.includes(seat[0])) && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Phụ thu ghế đôi:</span>
                    <span className='font-medium text-pink-400'>
                      +{vndFormat(COUPLE_SEAT_SURCHARGE * selectedSeats.filter(seat => hall?.seatLayout?.coupleSeatsRows?.includes(seat[0])).length)}
                    </span>
                  </div>
                )}
                {isEveningShow && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Phụ thu suất tối:</span>
                    <span className='font-medium text-yellow-400'>
                      +{vndFormat(EVENING_SURCHARGE * selectedSeats.length)}
                    </span>
                  </div>
                )}
                <div className='flex justify-between text-sm pt-2 border-t border-primary/10'>
                  <span className='text-gray-400'>Số lượng:</span>
                  <span className='font-medium'>{selectedSeats.length} ghế</span>
                </div>
              </div>
              
              {/* Tổng tiền */}
              <div className='flex justify-between items-center'>
                <span className='text-lg font-semibold'>Tổng cộng:</span>
                <span className='text-3xl font-bold text-primary'>
                  {vndFormat(calculateTotalAmount())}
                </span>
              </div>
            </div>
          </div>
        )}

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