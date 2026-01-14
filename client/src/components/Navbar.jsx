import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets'
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { useAppContext } from '../context/AppContext';


const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const searchInputRef = useRef(null)
    const { user } = useUser()
    const { openSignIn } = useClerk()
    const navigate = useNavigate()

    const { favoriteMovies } = useAppContext();

    // Focus input when search opens
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    // Handle search submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setShowSearch(false);
        }
    };

    // Close search on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setShowSearch(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div className=' fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5'>
            <Link to='/' className='max-md:flex-1 '>
                <img src={assets.logo} alt='' className='w-36 h-auto' />
            </Link>
            <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center
        max-md:justify-center gap-8 md:px-8 py-3 max-md:h-screen md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 
        overflow-hidden transition-[width] duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}`}>
                <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />

                <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to='/'>Trang Chủ</Link>
                <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to='/movies'>Phim đang chiếu</Link>
                <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to='/upcoming-movies'>Phim sắp khởi chiếu</Link>
                <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to='/search'>Thể loại</Link>
                {favoriteMovies.length > 0 && <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to='/favorite'>Yêu thích</Link>}
            </div>
            <div className='flex items-center gap-4 md:gap-8'>
                {/* Search Icon & Input */}
                <div className='relative'>
                    {showSearch ? (
                        <form onSubmit={handleSearchSubmit} className='flex items-center'>
                            <input
                                ref={searchInputRef}
                                type='text'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder='Tìm phim...'
                                className='w-40 md:w-56 px-4 py-2 bg-white/10 border border-gray-500 rounded-full text-sm focus:outline-none focus:border-primary transition'
                            />
                            <button
                                type='button'
                                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                                className='ml-2 text-gray-400 hover:text-white transition'
                            >
                                <XIcon className='w-5 h-5' />
                            </button>
                        </form>
                    ) : (
                        <SearchIcon
                            className='max-md:hidden w-6 h-6 cursor-pointer hover:text-primary transition'
                            onClick={() => setShowSearch(true)}
                        />
                    )}
                </div>
                {
                    !user ? (
                        <button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>Đăng nhập</button>
                    ) : (
                        <UserButton >
                            <UserButton.MenuItems>
                                <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15} />} onClick={() => navigate('/my-bookings')} />
                            </UserButton.MenuItems>
                        </UserButton>
                    )
                }

            </div>
            <MenuIcon className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />
        </div>
    )
}
export default Navbar