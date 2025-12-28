import React, { useEffect, useState, useMemo } from 'react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/AppContext';
import { Search, Mail, Calendar, Ticket } from 'lucide-react';

const ListUsers = () => {
  const {axios, getToken, user} = useAppContext();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const getAllUsers = async () => {
    try {
      const {data} = await axios.get('/api/admin/all-users', {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if(data && data.users){
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if(user){
      getAllUsers();
    }
  }, [user]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchQuery) {
        const userName = user.name || '';
        const userEmail = user.email || '';
        const query = searchQuery.toLowerCase();
        return userName.toLowerCase().includes(query) || userEmail.toLowerCase().includes(query);
      }
      return true;
    });
  }, [users, searchQuery]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return !isLoading ? (
    <>
      <Title text1="" text2="Danh sách người dùng" />

      {/* Search and Stats Section */}
      <div className="mt-6 mb-6 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tổng người dùng</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Người dùng mới (30 ngày)</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return new Date(u.createdAt) >= thirtyDaysAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Ticket className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Có yêu thích phim</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.favoriteMovies && u.favoriteMovies.length > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Results Count */}
        <div className="text-gray-400 text-sm">
          Hiển thị: <span className="text-white font-medium">{filteredUsers.length}</span> / {users.length} người dùng
        </div>
      </div>

      {filteredUsers && filteredUsers.length > 0 ? (
        <div className="w-full mt-6 overflow-x-auto">
          <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
            <thead>
              <tr className="bg-primary/20 text-left text-white">
                <th className="p-3 font-medium pl-5">Tên người dùng</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Ngày tham gia</th>
                <th className="p-3 font-medium">Phim yêu thích</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light">
              {filteredUsers.map((item, index) => (
                <tr key={index} className="border-b border-primary/20 bg-primary/5 even:bg-primary/10 hover:bg-primary/15 transition">
                  <td className="p-3 min-w-45 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {item.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-medium">{item.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-300">{item.email || 'N/A'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {item.createdAt ? formatDate(item.createdAt) : 'N/A'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {item.favoriteMovies?.length || 0} phim
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center mt-10 py-10 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-gray-400 text-lg">
            {users.length === 0 
              ? 'Chưa có người dùng nào' 
              : 'Không tìm thấy người dùng phù hợp'}
          </p>
          {filteredUsers.length === 0 && users.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-md text-sm font-medium"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      )}
    </>
  ) : <Loading />
}

export default ListUsers;

