import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon, FilterIcon, XIcon, Loader2 } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import BlurCircle from '../components/BlurCircle';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const SearchMovies = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { axios } = useAppContext();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'all');
    const [movies, setMovies] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch genres on mount
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const { data } = await axios.get('/api/show/genres');
                if (data.success) {
                    setGenres(data.genres);
                }
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        fetchGenres();
    }, [axios]);

    // Search movies function
    const searchMovies = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('query', searchQuery.trim());
            if (selectedGenre && selectedGenre !== 'all') params.append('genre', selectedGenre);

            const { data } = await axios.get(`/api/show/search?${params.toString()}`);
            if (data.success) {
                setMovies(data.movies);
            } else {
                toast.error(data.message || 'Không thể tìm kiếm phim');
            }
        } catch (error) {
            console.error('Error searching movies:', error);
            toast.error('Có lỗi xảy ra khi tìm kiếm');
        } finally {
            setLoading(false);
        }
    }, [axios, searchQuery, selectedGenre]);

    // Search when params change
    useEffect(() => {
        searchMovies();
    }, [selectedGenre]);

    // Update URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedGenre && selectedGenre !== 'all') params.set('genre', selectedGenre);
        setSearchParams(params);
    }, [searchQuery, selectedGenre, setSearchParams]);

    // Handle search submit
    const handleSearch = (e) => {
        e.preventDefault();
        searchMovies();
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGenre('all');
    };

    return (
        <div className='relative my-32 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
            <BlurCircle top="150px" left="0px" />
            <BlurCircle bottom="50px" right="50px" />

            {/* Header */}
            <div className='mb-8'>
                <h1 className='text-2xl md:text-3xl font-bold mb-2'>Tìm kiếm phim</h1>
                <p className='text-gray-400'>Tìm phim theo tên hoặc thể loại yêu thích</p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className='mb-6'>
                <div className='flex flex-col md:flex-row gap-4'>
                    {/* Search Input */}
                    <div className='flex-1 relative'>
                        <SearchIcon className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Nhập tên phim cần tìm...'
                            className='w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-500'
                        />
                        {searchQuery && (
                            <button
                                type='button'
                                onClick={() => setSearchQuery('')}
                                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition'
                            >
                                <XIcon className='w-5 h-5' />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle Button (Mobile) */}
                    <button
                        type='button'
                        onClick={() => setShowFilters(!showFilters)}
                        className='md:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-gray-700 rounded-xl hover:bg-white/10 transition'
                    >
                        <FilterIcon className='w-5 h-5' />
                        Bộ lọc
                    </button>

                    {/* Genre Select (Desktop) */}
                    <div className='hidden md:block'>
                        <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className='px-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition cursor-pointer min-w-[180px]'
                        >
                            <option value='all' className='bg-gray-900'>Tất cả thể loại</option>
                            {genres.map((genre) => (
                                <option key={genre.id} value={genre.id} className='bg-gray-900'>
                                    {genre.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Button */}
                    <button
                        type='submit'
                        disabled={loading}
                        className='flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dull rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading ? (
                            <Loader2 className='w-5 h-5 animate-spin' />
                        ) : (
                            <SearchIcon className='w-5 h-5' />
                        )}
                        Tìm kiếm
                    </button>
                </div>

                {/* Mobile Filters */}
                {showFilters && (
                    <div className='md:hidden mt-4 p-4 bg-white/5 border border-gray-700 rounded-xl'>
                        <label className='block text-sm text-gray-400 mb-2'>Thể loại</label>
                        <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className='w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl focus:border-primary outline-none transition cursor-pointer'
                        >
                            <option value='all' className='bg-gray-900'>Tất cả thể loại</option>
                            {genres.map((genre) => (
                                <option key={genre.id} value={genre.id} className='bg-gray-900'>
                                    {genre.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </form>

            {/* Active Filters */}
            {(searchQuery || selectedGenre !== 'all') && (
                <div className='flex flex-wrap items-center gap-2 mb-6'>
                    <span className='text-sm text-gray-400'>Đang lọc:</span>
                    {searchQuery && (
                        <span className='flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm'>
                            "{searchQuery}"
                            <button onClick={() => setSearchQuery('')} className='hover:text-white'>
                                <XIcon className='w-4 h-4' />
                            </button>
                        </span>
                    )}
                    {selectedGenre !== 'all' && (
                        <span className='flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm'>
                            {genres.find(g => g.id.toString() === selectedGenre)?.name || selectedGenre}
                            <button onClick={() => setSelectedGenre('all')} className='hover:text-white'>
                                <XIcon className='w-4 h-4' />
                            </button>
                        </span>
                    )}
                    <button
                        onClick={clearFilters}
                        className='text-sm text-gray-400 hover:text-white transition underline'
                    >
                        Xóa tất cả
                    </button>
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className='flex flex-col items-center justify-center py-20'>
                    <Loader2 className='w-12 h-12 animate-spin text-primary mb-4' />
                    <p className='text-gray-400'>Đang tìm kiếm...</p>
                </div>
            ) : movies.length > 0 ? (
                <>
                    <p className='text-gray-400 mb-6'>
                        Tìm thấy <span className='text-white font-medium'>{movies.length}</span> phim
                    </p>
                    <div className='flex flex-wrap max-sm:justify-center gap-8'>
                        {movies.map((movie) => (
                            <MovieCard movie={movie} key={movie._id} />
                        ))}
                    </div>
                </>
            ) : (
                <div className='flex flex-col items-center justify-center py-20'>
                    <SearchIcon className='w-16 h-16 text-gray-600 mb-4' />
                    <h2 className='text-xl font-medium mb-2'>Không tìm thấy phim</h2>
                    <p className='text-gray-400 text-center max-w-md'>
                        {searchQuery || selectedGenre !== 'all'
                            ? 'Thử thay đổi từ khóa hoặc bộ lọc để tìm phim phù hợp hơn'
                            : 'Hiện tại chưa có phim nào đang chiếu. Vui lòng quay lại sau!'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchMovies;
