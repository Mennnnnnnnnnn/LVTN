import { StarIcon } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import timeFormat from '../lib/timeFormat';
import { getYear } from '../lib/dateFormat';
import { useAppContext } from '../context/AppContext';

const MovieCard = ({movie}) => {
    const navigate = useNavigate()

    const {image_base_url} = useAppContext();
    const movieId = movie._id || movie.id;
  return (
    <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66'>
        <img onClick={()=> {navigate(`/movies/${movieId}`) ; scrollTo(0,0)}}
        src={image_base_url + movie.backdrop_path} alt="" className='rounded-lg h-52 w-full object-cover object-bottom-right cursor-pointer' />
        <p className='font-semibold mt-2 truncate'>{movie.title}</p>
        <p className=' text-sm text-gray-400 mt-2'> 
            {getYear(movie.release_date)}.{movie.genres.slice(0,2).map(genre => genre.name).join(" | ")} . {timeFormat(movie.runtime)}
        </p>
        <div className='flex items-center justify-between mt-4 pb-3'>
            <button onClick={()=>{navigate(`/movies/${movieId}`) ; scrollTo(0,0)}} className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>Mua Vé</button>
            <p className='flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1'>
              <StarIcon className="w-4 h-4 text-primary fill-primary" />
              {movie.vote_average}
            </p>
        </div>
    </div>
  )
}
export default MovieCard