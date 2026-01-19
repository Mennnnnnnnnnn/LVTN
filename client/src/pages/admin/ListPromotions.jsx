import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    Pencil,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Calendar,
    Percent,
    Tag,
    Gift,
    Loader2,
    XIcon
} from 'lucide-react';
import { vndFormat } from '../../lib/currencyFormat';

const ListPromotions = () => {
    const { axios, getToken } = useAppContext();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discountPercent: '',
        startDate: '',
        endDate: '',
        type: 'special',
        applicableDays: [],
        maxUsage: 0,

        maxUsagePerUser: 0,
        // Banner fields
        bannerImage: '',
        bannerTitle: '',
        bannerSubtitle: '',
        showBanner: false,
        bannerOrder: 0,
        // Default banner fields
        isDefaultBanner: false,
        defaultBannerMovieTitle: '',
        defaultBannerGenres: '',
        defaultBannerYear: '',
        defaultBannerDuration: '',
        defaultBannerDescription: '',
        defaultBannerBackground: ''

    });

    const promotionTypes = [
        { value: 'holiday', label: 'Ngày lễ', icon: '🎉' },
        { value: 'special', label: 'Đặc biệt', icon: '⭐' },
        { value: 'weekly', label: 'Hàng tuần', icon: '📅' },
        { value: 'default_banner', label: 'Banner mặc định trang chủ', icon: '🎬' }
    ];

    const daysOfWeek = [
        { value: 0, label: 'Chủ nhật' },
        { value: 1, label: 'Thứ 2' },
        { value: 2, label: 'Thứ 3' },
        { value: 3, label: 'Thứ 4' },
        { value: 4, label: 'Thứ 5' },
        { value: 5, label: 'Thứ 6' },
        { value: 6, label: 'Thứ 7' }
    ];

    // Fetch promotions
    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/promotion/all', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                setPromotions(data.promotions);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            discountPercent: '',
            startDate: '',
            endDate: '',
            type: 'special',
            applicableDays: [],
            maxUsage: 0,

            maxUsagePerUser: 0,
            bannerImage: '',
            bannerTitle: '',
            bannerSubtitle: '',
            showBanner: false,
            bannerOrder: 0,
            isDefaultBanner: false,
            defaultBannerMovieTitle: '',
            defaultBannerGenres: '',
            defaultBannerYear: '',
            defaultBannerDuration: '',
            defaultBannerDescription: '',
            defaultBannerBackground: ''

        });
        setEditingPromotion(null);
    };

    // Open modal for create
    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    // Open modal for edit
    const openEditModal = (promotion) => {
        setEditingPromotion(promotion);
        setFormData({
            name: promotion.name,
            description: promotion.description || '',
            discountPercent: promotion.discountPercent,
            startDate: new Date(promotion.startDate).toISOString().split('T')[0],
            endDate: new Date(promotion.endDate).toISOString().split('T')[0],
            type: promotion.type,
            applicableDays: promotion.applicableDays || [],
            maxUsage: promotion.maxUsage || 0,

            maxUsagePerUser: promotion.maxUsagePerUser || 0,
            bannerImage: promotion.bannerImage || '',
            bannerTitle: promotion.bannerTitle || '',
            bannerSubtitle: promotion.bannerSubtitle || '',
            showBanner: promotion.showBanner || false,
            bannerOrder: promotion.bannerOrder || 0,
            isDefaultBanner: promotion.isDefaultBanner || false,
            defaultBannerMovieTitle: promotion.defaultBannerMovieTitle || '',
            defaultBannerGenres: promotion.defaultBannerGenres || '',
            defaultBannerYear: promotion.defaultBannerYear || '',
            defaultBannerDuration: promotion.defaultBannerDuration || '',
            defaultBannerDescription: promotion.defaultBannerDescription || '',
            defaultBannerBackground: promotion.defaultBannerBackground || ''

        });
        setShowModal(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = await getToken();
            let response;

            if (editingPromotion) {
                response = await axios.put(`/api/promotion/update/${editingPromotion._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                response = await axios.post('/api/promotion/create', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setShowModal(false);
                resetForm();
                fetchPromotions();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle promotion status
    const toggleStatus = async (promotionId) => {
        try {
            const { data } = await axios.patch(`/api/promotion/toggle/${promotionId}`, {}, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                toast.success(data.message);
                fetchPromotions();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    // Delete promotion
    const deletePromotion = async (promotionId) => {
        if (!confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;

        try {
            const { data } = await axios.delete(`/api/promotion/delete/${promotionId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                toast.success(data.message);
                fetchPromotions();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    // Handle day selection for weekly type
    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            applicableDays: prev.applicableDays.includes(day)
                ? prev.applicableDays.filter(d => d !== day)
                : [...prev.applicableDays, day]
        }));
    };

    // Format date for display
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Check if promotion is active now
    const isPromotionActiveNow = (promotion) => {
        const now = new Date();
        const start = new Date(promotion.startDate);
        const end = new Date(promotion.endDate);
        return promotion.isActive && now >= start && now <= end;
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <Loader2 className='w-10 h-10 animate-spin text-primary' />
            </div>
        );
    }

    return (
        <div>
            <div className='flex justify-between items-center mb-6'>
                <Title text2="Quản lý khuyến mãi" />
                <button
                    onClick={openCreateModal}
                    className='flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition'
                >
                    <PlusIcon className='w-5 h-5' />
                    Thêm khuyến mãi
                </button>
            </div>

            {/* Promotions List */}
            {promotions.length === 0 ? (
                <div className='text-center py-20'>
                    <Gift className='w-16 h-16 mx-auto text-gray-600 mb-4' />
                    <p className='text-gray-400'>Chưa có khuyến mãi nào</p>
                </div>
            ) : (
                <div className='grid gap-4'>
                    {promotions.map(promotion => (
                        <div
                            key={promotion._id}
                            className={`p-4 rounded-xl border ${isPromotionActiveNow(promotion)
                                ? 'border-green-500/50 bg-green-500/5'
                                : promotion.isActive
                                    ? 'border-gray-700 bg-white/5'
                                    : 'border-gray-800 bg-gray-900/50 opacity-60'
                                }`}
                        >
                            <div className='flex flex-wrap items-start justify-between gap-4'>
                                <div className='flex-1 min-w-[200px]'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <span className='text-2xl'>
                                            {promotionTypes.find(t => t.value === promotion.type)?.icon}
                                        </span>
                                        <h3 className='text-lg font-semibold'>{promotion.name}</h3>
                                        {isPromotionActiveNow(promotion) && (
                                            <span className='px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full'>
                                                Đang áp dụng
                                            </span>
                                        )}
                                    </div>
                                    {promotion.description && (
                                        <p className='text-gray-400 text-sm mb-2'>{promotion.description}</p>
                                    )}
                                    <div className='flex flex-wrap gap-4 text-sm text-gray-300'>
                                        <div className='flex items-center gap-1'>
                                            <Percent className='w-4 h-4 text-primary' />
                                            <span className='font-bold text-primary'>{promotion.discountPercent}%</span>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Calendar className='w-4 h-4' />
                                            {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Tag className='w-4 h-4' />
                                            {promotionTypes.find(t => t.value === promotion.type)?.label}
                                        </div>
                                    </div>
                                    {promotion.type === 'weekly' && promotion.applicableDays?.length > 0 && (
                                        <div className='mt-2 text-sm text-gray-400'>
                                            Áp dụng: {promotion.applicableDays.map(d =>
                                                daysOfWeek.find(day => day.value === d)?.label
                                            ).join(', ')}
                                        </div>
                                    )}
                                    {promotion.maxUsage > 0 && (
                                        <div className='mt-1 text-sm text-gray-400'>
                                            Đã dùng: {promotion.usageCount || 0}/{promotion.maxUsage} lượt
                                        </div>
                                    )}
                                    {promotion.maxUsagePerUser > 0 && (
                                        <div className='mt-1 text-sm text-yellow-400'>
                                            Giới hạn: {promotion.maxUsagePerUser} lượt/tài khoản
                                        </div>
                                    )}

                                    {promotion.isDefaultBanner && (
                                        <div className='mt-1 text-sm text-blue-400'>
                                            🎬 Đây là Banner mặc định trang chủ
                                        </div>
                                    )}
                                    {promotion.showBanner && !promotion.isDefaultBanner && (
                                        <div className='mt-1 text-sm text-purple-400'>
                                            🖼️ Hiển thị banner khuyến mãi
                                        </div>
                                    )}

                                </div>
                                <div className='flex items-center gap-2'>
                                    <button
                                        onClick={() => toggleStatus(promotion._id)}
                                        className={`p-2 rounded-lg transition ${promotion.isActive
                                            ? 'text-green-400 hover:bg-green-500/20'
                                            : 'text-gray-500 hover:bg-gray-700'
                                            }`}
                                        title={promotion.isActive ? 'Tắt khuyến mãi' : 'Bật khuyến mãi'}
                                    >
                                        {promotion.isActive ? (
                                            <ToggleRight className='w-6 h-6' />
                                        ) : (
                                            <ToggleLeft className='w-6 h-6' />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(promotion)}
                                        className='p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition'
                                        title='Chỉnh sửa'
                                    >
                                        <Pencil className='w-5 h-5' />
                                    </button>
                                    <button
                                        onClick={() => deletePromotion(promotion._id)}
                                        className='p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition'
                                        title='Xóa'
                                    >
                                        <Trash2 className='w-5 h-5' />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
                    <div className='bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between p-4 border-b border-gray-700'>
                            <h2 className='text-xl font-bold'>
                                {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 hover:bg-gray-700 rounded-lg transition'
                            >
                                <XIcon className='w-6 h-6' />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
                            {/* Name */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>
                                    Tên khuyến mãi <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                    placeholder='VD: Khuyến mãi Tết 2026'
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none resize-none'
                                    rows={2}
                                    placeholder='Mô tả chi tiết về khuyến mãi...'
                                />
                            </div>

                            {/* Discount Percent */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>
                                    Phần trăm giảm giá <span className='text-red-500'>*</span>
                                </label>
                                <div className='relative'>
                                    <input
                                        type='number'
                                        value={formData.discountPercent}
                                        onChange={e => setFormData({ ...formData, discountPercent: e.target.value })}
                                        className='w-full px-4 py-2 pr-10 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                        placeholder='VD: 20'
                                        min={0}
                                        max={100}
                                        required
                                    />
                                    <span className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400'>%</span>
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>Loại khuyến mãi</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none cursor-pointer'
                                >
                                    {promotionTypes.map(type => (
                                        <option key={type.value} value={type.value} className='bg-gray-900'>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Applicable Days for Weekly */}
                            {formData.type === 'weekly' && (
                                <div>
                                    <label className='block text-sm text-gray-400 mb-2'>Áp dụng vào các ngày</label>
                                    <div className='flex flex-wrap gap-2'>
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day.value}
                                                type='button'
                                                onClick={() => handleDayToggle(day.value)}
                                                className={`px-3 py-1.5 rounded-lg text-sm transition ${formData.applicableDays.includes(day.value)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/5 border border-gray-700 hover:border-primary'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Date Range */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm text-gray-400 mb-1'>
                                        Ngày bắt đầu <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='date'
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm text-gray-400 mb-1'>
                                        Ngày kết thúc <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='date'
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                        required
                                    />
                                </div>
                            </div>

                            {/* Max Usage */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>
                                    Số lượt sử dụng tối đa
                                </label>
                                <input
                                    type='number'
                                    value={formData.maxUsage}
                                    onChange={e => setFormData({ ...formData, maxUsage: parseInt(e.target.value) || 0 })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                    placeholder='0 = Không giới hạn'
                                    min={0}
                                />
                                <p className='text-xs text-gray-500 mt-1'>Nhập 0 để không giới hạn số lượt</p>
                            </div>

                            {/* Max Usage Per User */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>
                                    Số lượt tối đa cho mỗi tài khoản
                                </label>
                                <input
                                    type='number'
                                    value={formData.maxUsagePerUser}
                                    onChange={e => setFormData({ ...formData, maxUsagePerUser: parseInt(e.target.value) || 0 })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                    placeholder='0 = Không giới hạn'
                                    min={0}
                                />
                                <p className='text-xs text-gray-500 mt-1'>Nhập 0 để không giới hạn. VD: 1 = mỗi tài khoản chỉ được dùng 1 lần</p>
                            </div>

                            {/* ============== BANNER KHUYẾN MÃI ============== */}
                            <div className='border-t border-gray-700 pt-4 mt-4'>
                                <h3 className='text-base font-semibold mb-3'>🖼️ Banner Khuyến Mãi (Slider trang chủ)</h3>

                                {/* Show Banner */}
                                <div className='flex items-center gap-2 mb-4'>
                                    <input
                                        type='checkbox'
                                        id='showBanner'
                                        checked={formData.showBanner}
                                        onChange={e => setFormData({ ...formData, showBanner: e.target.checked })}
                                        className='w-4 h-4'
                                    />
                                    <label htmlFor='showBanner' className='text-sm text-gray-300'>
                                        Hiển thị banner khuyến mãi trên trang chủ
                                    </label>
                                </div>

                                {formData.showBanner && (
                                    <>
                                        <div className='space-y-4'>
                                            {/* Banner Image */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>URL hình ảnh banner</label>
                                                <input
                                                    type='text'
                                                    value={formData.bannerImage}
                                                    onChange={e => setFormData({ ...formData, bannerImage: e.target.value })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                    placeholder='https://example.com/banner.jpg'
                                                />
                                            </div>

                                            {/* Banner Title */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>Tiêu đề banner</label>
                                                <input
                                                    type='text'
                                                    value={formData.bannerTitle}
                                                    onChange={e => setFormData({ ...formData, bannerTitle: e.target.value })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                    placeholder='VD: GIẢM GIÁ SỐC 50%'
                                                />
                                            </div>

                                            {/* Banner Subtitle */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>Phụ đề banner</label>
                                                <input
                                                    type='text'
                                                    value={formData.bannerSubtitle}
                                                    onChange={e => setFormData({ ...formData, bannerSubtitle: e.target.value })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                    placeholder='VD: Cho tất cả các suất chiếu'
                                                />
                                            </div>

                                            {/* Banner Order */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>Thứ tự hiển thị</label>
                                                <input
                                                    type='number'
                                                    value={formData.bannerOrder}
                                                    onChange={e => setFormData({ ...formData, bannerOrder: parseInt(e.target.value) || 0 })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                    placeholder='0'
                                                    min={0}
                                                />
                                                <p className='text-xs text-gray-500 mt-1'>Số nhỏ hiển thị trước</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ============== BANNER MẶC ĐỊNH TRANG CHỦ ============== */}
                            <div className='border-t border-gray-700 pt-4 mt-4'>
                                <h3 className='text-base font-semibold mb-3'>🎬 Banner Mặc Định Trang Chủ</h3>

                                {/* Is Default Banner */}
                                <div className='flex items-center gap-2 mb-4'>
                                    <input
                                        type='checkbox'
                                        id='isDefaultBanner'
                                        checked={formData.isDefaultBanner}
                                        onChange={e => setFormData({ ...formData, isDefaultBanner: e.target.checked })}
                                        className='w-4 h-4'
                                    />
                                    <label htmlFor='isDefaultBanner' className='text-sm text-gray-300'>
                                        Đây là banner mặc định trang chủ (thay thế Marvel)
                                    </label>
                                </div>

                                {formData.isDefaultBanner && (
                                    <>
                                        <div className='space-y-4'>
                                            {/* Default Banner Background */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>URL hình nền</label>
                                                <input
                                                    type='text'
                                                    value={formData.defaultBannerBackground}
                                                    onChange={e => setFormData({ ...formData, defaultBannerBackground: e.target.value })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                    placeholder='https://example.com/background.jpg'
                                                />
                                            </div>

                                            {/* Default Banner Movie Title */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>Tên phim</label>
                                                <input
                                                    type='text'
                                                    value={formData.defaultBannerMovieTitle}
                                                    onChange={e => setFormData({ ...formData, defaultBannerMovieTitle: e.target.value })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                    placeholder='VD: Guardians of the Galaxy'
                                                />
                                            </div>

                                            {/* Default Banner Genres */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>Thể loại</label>
                                                <input
                                                    type='text'
                                                    value={formData.defaultBannerGenres}
                                                    onChange={e => setFormData({ ...formData, defaultBannerGenres: e.target.value })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                    placeholder='VD: Hành động | Phiêu lưu | Khoa học viễn tưởng'
                                                />
                                            </div>

                                            <div className='grid grid-cols-2 gap-4'>
                                                {/* Default Banner Year */}
                                                <div>
                                                    <label className='block text-sm text-gray-400 mb-1'>Năm phát hành</label>
                                                    <input
                                                        type='text'
                                                        value={formData.defaultBannerYear}
                                                        onChange={e => setFormData({ ...formData, defaultBannerYear: e.target.value })}
                                                        className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                        placeholder='VD: 2018'
                                                    />
                                                </div>

                                                {/* Default Banner Duration */}
                                                <div>
                                                    <label className='block text-sm text-gray-400 mb-1'>Thời lượng</label>
                                                    <input
                                                        type='text'
                                                        value={formData.defaultBannerDuration}
                                                        onChange={e => setFormData({ ...formData, defaultBannerDuration: e.target.value })}
                                                        className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                                        placeholder='VD: 2h 8m'
                                                    />
                                                </div>
                                            </div>

                                            {/* Default Banner Description */}
                                            <div>
                                                <label className='block text-sm text-gray-400 mb-1'>Mô tả ngắn</label>
                                                <textarea
                                                    value={formData.defaultBannerDescription}
                                                    onChange={e => setFormData({ ...formData, defaultBannerDescription: e.target.value })}
                                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none resize-none'
                                                    rows={3}
                                                    placeholder='Mô tả ngắn về phim...'
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>


                            {/* Submit Button */}
                            <div className='flex gap-3 pt-4'>
                                <button
                                    type='button'
                                    onClick={() => setShowModal(false)}
                                    className='flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition'
                                >
                                    Hủy
                                </button>
                                <button
                                    type='submit'
                                    disabled={submitting}
                                    className='flex-1 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2'
                                >
                                    {submitting && <Loader2 className='w-4 h-4 animate-spin' />}
                                    {editingPromotion ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListPromotions;
