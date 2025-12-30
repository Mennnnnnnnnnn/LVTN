import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3,
  Search,
  Filter,
  AlertCircle,
  Wrench,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import AddEditCinemaHallModal from '../../components/admin/AddEditCinemaHallModal';
import { vndFormat } from '../../lib/currencyFormat';

const ListCinemaHalls = () => {
  const { axios, getToken } = useAppContext();
  const [halls, setHalls] = useState([]);
  const [filteredHalls, setFilteredHalls] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch halls
  const fetchHalls = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/hall/all');
      if (data.success) {
        setHalls(data.halls);
        setFilteredHalls(data.halls);
      }
    } catch (error) {
      console.error('Error fetching halls:', error);
      toast.error('Không thể tải danh sách phòng chiếu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const { data } = await axios.get('/api/hall/statistics/all');
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchHalls();
    fetchStatistics();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...halls];

    // Search filter
    if (searchTerm) {
      result = result.filter(hall =>
        hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hall.hallNumber.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(hall => hall.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(hall => hall.type === typeFilter);
    }

    setFilteredHalls(result);
  }, [searchTerm, statusFilter, typeFilter, halls]);

  // Handle add new hall
  const handleAddNew = () => {
    setEditingHall(null);
    setIsModalOpen(true);
  };

  // Handle edit hall
  const handleEdit = (hall) => {
    setEditingHall(hall);
    setIsModalOpen(true);
  };

  // Handle delete hall
  const handleDelete = async (hallId, hallName) => {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa phòng "${hallName}"?`)) {
      return;
    }

    try {
      const { data } = await axios.delete(`/api/hall/${hallId}`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if (data.success) {
        toast.success(data.message);
        fetchHalls();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting hall:', error);
      toast.error('Không thể xóa phòng chiếu');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (hallId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'maintenance' : 'active';
    const note = newStatus === 'maintenance' 
      ? prompt('Nhập lý do bảo trì:') 
      : null;

    if (newStatus === 'maintenance' && !note) return;

    try {
      const { data } = await axios.patch(`/api/hall/${hallId}/status`, {
        status: newStatus,
        maintenanceNote: note,
        maintenanceStartDate: newStatus === 'maintenance' ? new Date() : null
      }, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });

      if (data.success) {
        toast.success(data.message);
        fetchHalls();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  // Get statistics for a hall
  const getHallStats = (hallId) => {
    return statistics.find(s => s.hallId === hallId) || {
      totalShows: 0,
      totalRevenue: 0,
      totalSeatsBooked: 0
    };
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: {
        icon: CheckCircle,
        text: 'Hoạt động',
        className: 'bg-green-100 text-green-700'
      },
      maintenance: {
        icon: Wrench,
        text: 'Bảo trì',
        className: 'bg-yellow-100 text-yellow-700'
      },
      inactive: {
        icon: XCircle,
        text: 'Vô hiệu',
        className: 'bg-gray-100 text-gray-700'
      }
    };

    const badge = badges[status] || badges.inactive;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.className}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const colors = {
      'Standard': 'bg-gray-100 text-gray-700',
      'VIP': 'bg-purple-100 text-purple-700',
      'IMAX': 'bg-blue-100 text-blue-700',
      '4DX': 'bg-orange-100 text-orange-700'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[type] || colors.Standard}`}>
        {type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <Building2 className="w-8 h-8 text-primary" />
            Quản lý Phòng Chiếu
          </h1>
          <p className="text-gray-400 mt-1">
            Quản lý thông tin, sơ đồ ghế và trạng thái các phòng chiếu
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dull transition flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Thêm Phòng Chiếu
        </button>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-primary/20 p-6 rounded-xl border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium">Tổng phòng</p>
              <p className="text-3xl font-bold text-white mt-1">{halls.length}</p>
            </div>
            <Building2 className="w-12 h-12 text-primary opacity-70" />
          </div>
        </div>

        <div className="bg-green-500/20 p-6 rounded-xl border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium">Đang hoạt động</p>
              <p className="text-3xl font-bold text-white mt-1">
                {halls.filter(h => h.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-70" />
          </div>
        </div>

        <div className="bg-yellow-500/20 p-6 rounded-xl border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium">Đang bảo trì</p>
              <p className="text-3xl font-bold text-white mt-1">
                {halls.filter(h => h.status === 'maintenance').length}
              </p>
            </div>
            <Wrench className="w-12 h-12 text-yellow-500 opacity-70" />
          </div>
        </div>

        <div className="bg-purple-500/20 p-6 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 font-medium">Tổng ghế</p>
              <p className="text-3xl font-bold text-white mt-1">
                {halls.reduce((sum, h) => sum + h.totalSeats, 0)}
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-purple-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc số phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
            <option value="inactive">Vô hiệu</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white"
          >
            <option value="all">Tất cả loại</option>
            <option value="Standard">Standard</option>
            <option value="VIP">VIP</option>
            <option value="IMAX">IMAX</option>
            <option value="4DX">4DX</option>
          </select>
        </div>
      </div>

      {/* Halls Table */}
      <div className="bg-primary/10 rounded-xl border border-primary/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/20 border-b border-primary/20">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Phòng</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Loại</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Ghế</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Thống kê</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {filteredHalls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">Không tìm thấy phòng chiếu nào</p>
                  </td>
                </tr>
              ) : (
                filteredHalls.map((hall) => {
                  const stats = getHallStats(hall._id);
                  return (
                    <tr key={hall._id} className="hover:bg-primary/5 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">{hall.name}</p>
                          <p className="text-sm text-gray-400">Phòng số {hall.hallNumber}</p>
                          {hall.brokenSeats?.length > 0 && (
                            <p className="text-xs text-red-400 mt-1">
                              ⚠️ {hall.brokenSeats.length} ghế hỏng
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(hall.type)}
                        <p className="text-xs text-gray-400 mt-1">
                          ×{hall.priceMultiplier} giá
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{hall.totalSeats}</p>
                        <p className="text-xs text-gray-400">
                          {hall.seatLayout?.rows?.length || 0} dãy × {hall.seatLayout?.seatsPerRow || 0}
                        </p>
                        {hall.seatLayout?.coupleSeatsRows?.length > 0 && (
                          <p className="text-xs text-pink-400">💑 Có ghế đôi</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(hall.status)}
                        {hall.status === 'maintenance' && hall.maintenanceNote && (
                          <p className="text-xs text-gray-400 mt-1">{hall.maintenanceNote}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-300">
                            <span className="font-medium text-white">{stats.totalShows}</span> suất chiếu
                          </p>
                          <p className="text-gray-300">
                            <span className="font-medium text-green-400">
                              {vndFormat(stats.totalRevenue)}
                            </span>
                          </p>
                          <p className="text-gray-300">
                            <span className="font-medium text-white">{stats.totalSeatsBooked}</span> ghế đã bán
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(hall._id, hall.status)}
                            className={`p-2 rounded-lg transition ${
                              hall.status === 'active'
                                ? 'hover:bg-yellow-500/20 text-yellow-500'
                                : 'hover:bg-green-500/20 text-green-500'
                            }`}
                            title={hall.status === 'active' ? 'Chuyển sang bảo trì' : 'Kích hoạt'}
                          >
                            {hall.status === 'active' ? (
                              <Wrench className="w-5 h-5" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(hall)}
                            className="p-2 hover:bg-blue-500/20 text-blue-500 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(hall._id, hall.name)}
                            className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AddEditCinemaHallModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHall(null);
        }}
        onSave={() => {
          fetchHalls();
          fetchStatistics();
        }}
        editHall={editingHall}
      />
    </div>
  );
};

export default ListCinemaHalls;

