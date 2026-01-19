import React from 'react';
import Navbar from './components/Navbar';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBookings from './pages/MyBookings';
import Favorite from './pages/Favorite';
import About from './pages/About';
import RefundPolicy from './pages/RefundPolicy';
import FAQ from './pages/FAQ';
import BookingGuide from './pages/BookingGuide';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer';
import Movies from './pages/Movies';
import UpcomingMovies from './pages/UpcomingMovies';
import SearchMovies from './pages/SearchMovies';
import PromotionDetailPage from "./pages/PromotionDetailPage";
import Layout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import AddShows from './pages/admin/AddShows';
import ListShows from './pages/admin/ListShows';
import ListBookings from './pages/admin/ListBookings';
import ListUsers from './pages/admin/ListUsers';
import ListCinemaHalls from './pages/admin/ListCinemaHalls';
import ListPromotions from './pages/admin/ListPromotions';
import ListBanners from './pages/admin/ListBanners';


import Loading from './components/Loading';

import { useAppContext } from './context/AppContext';
import { SignIn, useAuth } from '@clerk/clerk-react';


const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin')
  const { isLoaded, isSignedIn } = useAuth();

  const { user } = useAppContext();

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/upcoming-movies' element={<UpcomingMovies />} />
        <Route path='/search' element={<SearchMovies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movies/:id/:date' element={<SeatLayout />} />
        <Route path='/my-bookings' element={<MyBookings />} />
        <Route path='/loading/:nextUrl' element={<Loading />} />
        <Route path='/about' element={<About />} />
        <Route path='/refund-policy' element={<RefundPolicy />} />
        <Route path='/faq' element={<FAQ />} />
        <Route path='/booking-guide' element={<BookingGuide />} />
        <Route path='/terms-of-service' element={<TermsOfService />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />
        <Route path='/favorite' element={<Favorite />} />

        <Route path='/promotion/:promotionId' element={<PromotionDetailPage />} />

        <Route path='/admin/*' element={
          !isLoaded ? (
            <div className='min-h-screen flex justify-center items-center bg-[#0f0f0f]'>
              <div className='flex flex-col items-center gap-4'>
                <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary'></div>
                <p className='text-gray-400'>Đang tải...</p>
              </div>
            </div>
          ) : isSignedIn ? (
            <Layout />
          ) : (
            <div className='min-h-screen flex justify-center items-center'>
              <SignIn fallbackRedirectUrl={'/admin'} />
            </div>
          )
        }>
          <Route index element={<Dashboard />} />
          <Route path="cinema-halls" element={<ListCinemaHalls />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="list-bookings" element={<ListBookings />} />
          <Route path="list-users" element={<ListUsers />} />
          <Route path="promotions" element={<ListPromotions />} />
          <Route path="banners" element={<ListBanners />} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  )
}
export default App