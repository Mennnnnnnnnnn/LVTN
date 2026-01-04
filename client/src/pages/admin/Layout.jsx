import React, { useEffect } from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const Layout = () => {

  const { isAdmin, isAdminLoading, fetchIsAdmin, user } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchIsAdmin();
    }
  }, [user]);

  // Show loading while checking admin status
  if (isAdminLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-[#0f0f0f]'>
        <div className='flex flex-col items-center gap-4'>
          <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary'></div>
          <p className='text-gray-400'>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Not admin - redirect handled in AppContext
  if (!isAdmin) {
    return (
      <div className='flex justify-center items-center h-screen bg-[#0f0f0f]'>
        <div className='text-center'>
          <p className='text-red-500 text-xl mb-4'>Bạn không có quyền truy cập trang này</p>
          <button
            onClick={() => navigate('/')}
            className='px-6 py-2 bg-primary hover:bg-primary-dull rounded-full transition'
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className='flex'>
        <AdminSidebar />
        <div className='flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto'>
          <Outlet />
        </div>
      </div>
    </>
  );
}
export default Layout 
