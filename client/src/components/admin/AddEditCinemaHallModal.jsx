import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import SeatLayoutDesigner from './SeatLayoutDesigner';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const AddEditCinemaHallModal = ({ isOpen, onClose, onSave, editHall }) => {
  const { axios, getToken } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    hallNumber: '',
    type: 'Standard',
    priceMultiplier: 1,
    status: 'active',
    maintenanceNote: '',
  });

  const [layoutData, setLayoutData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data khi edit
  useEffect(() => {
    if (editHall) {
      setFormData({
        name: editHall.name || '',
        hallNumber: editHall.hallNumber || '',
        type: editHall.type || 'Standard',
        priceMultiplier: editHall.priceMultiplier || 1,
        status: editHall.status || 'active',
        maintenanceNote: editHall.maintenanceNote || '',
      });
    } else {
      // Reset form khi thêm mới
      setFormData({
        name: '',
        hallNumber: '',
        type: 'Standard',
        priceMultiplier: 1,
        status: 'active',
        maintenanceNote: '',
      });
    }
  }, [editHall, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!layoutData) {
      return toast.error('Vui lòng thiết kế sơ đồ ghế');
    }

    if (!formData.name || !formData.hallNumber) {
      return toast.error('Vui lòng điền đầy đủ thông tin');
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        hallNumber: parseInt(formData.hallNumber),
        priceMultiplier: parseFloat(formData.priceMultiplier),
        totalSeats: layoutData.totalSeats,
        seatLayout: layoutData.seatLayout,
        customRowSeats: layoutData.customRowSeats,
        brokenSeats: layoutData.brokenSeats,
      };

      // Lấy token để authenticate
      const token = await getToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };

      let response;
      if (editHall) {
        // Update existing hall
        response = await axios.put(`/api/hall/${editHall._id}`, dataToSend, { headers });
      } else {
        // Create new hall
        response = await axios.post('/api/hall/create', dataToSend, { headers });
      }

      if (response.data.success) {
        toast.success(response.data.message);
        onSave && onSave();
        onClose();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error saving cinema hall:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">
              {editHall ? 'Chỉnh sửa phòng chiếu' : 'Thêm phòng chiếu mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Tên phòng chiếu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="VD: Phòng VIP 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Số phòng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="hallNumber"
                  value={formData.hallNumber}
                  onChange={handleInputChange}
                  placeholder="VD: 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Loại phòng <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="Standard">Standard</option>
                  <option value="VIP">VIP</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Hệ số giá (Price Multiplier)
                </label>
                <input
                  type="number"
                  name="priceMultiplier"
                  value={formData.priceMultiplier}
                  onChange={handleInputChange}
                  step="0.1"
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Standard: 1.0, VIP: 1.5, IMAX: 2.0
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="active">Hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>

              {formData.status === 'maintenance' && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Ghi chú bảo trì
                  </label>
                  <input
                    type="text"
                    name="maintenanceNote"
                    value={formData.maintenanceNote}
                    onChange={handleInputChange}
                    placeholder="VD: Sửa chữa hệ thống âm thanh"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t pt-6">
              <SeatLayoutDesigner
                value={layoutData}
                onChange={setLayoutData}
                existingHall={editHall}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCinemaHallModal;

