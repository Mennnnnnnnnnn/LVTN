import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedSection from '../components/FeaturedSection';
import UpcomingSection from '../components/UpcomingSection';
import TrailersSection from '../components/TrailersSection';
import PromotionBanner from '../components/PromotionBanner';

const Home = () => {
  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <UpcomingSection />
      <TrailersSection />
      <PromotionBanner />
    </>
  )
}
export default Home