import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    Pencil,
    Trash2,
    Image,
    Eye,
    EyeOff,
    Loader2,
    XIcon,
    GripVertical,
    ExternalLink
} from 'lucide-react';

const ListBanners = () => {
    const { axios, getToken } = useAppContext();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state for banner
    const [formData, setFormData] = useState({
        bannerImage: '',
        bannerTitle: '',
        bannerSubtitle: '',
        showBanner: true,
        bannerOrder: 0
    });

    // Fetch promotions with banners
    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/promotion/all', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                // Sort by bannerOrder
                const sorted = data.promotions.sort((a, b) => (a.bannerOrder || 0) - (b.bannerOrder || 0));
                setPromotions(sorted);
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
            bannerImage: '',
            bannerTitle: '',
            bannerSubtitle: '',
            showBanner: true,
            bannerOrder: 0
        });
        setEditingPromotion(null);
    };

    // Open modal for edit banner
    const openEditModal = (promotion) => {
        setEditingPromotion(promotion);
        setFormData({
            bannerImage: promotion.bannerImage || '',
            bannerTitle: promotion.bannerTitle || '',
            bannerSubtitle: promotion.bannerSubtitle || '',
            showBanner: promotion.showBanner || false,
            bannerOrder: promotion.bannerOrder || 0
        });
        setShowModal(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.bannerImage) {
            toast.error('Vui lòng nhập URL hình ảnh banner');
            return;
        }

        setSubmitting(true);

        try {
            const token = await getToken();
            const response = await axios.put(`/api/promotion/update/${editingPromotion._id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Cập nhật banner thành công');
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

    // Toggle banner visibility
    const toggleBannerVisibility = async (promotionId, currentStatus) => {
        try {
            const { data } = await axios.put(`/api/promotion/update/${promotionId}`, {
                showBanner: !currentStatus
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                toast.success(data.promotion.showBanner ? 'Đã hiển thị banner' : 'Đã ẩn banner');
                fetchPromotions();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    // Remove banner from promotion
    const removeBanner = async (promotionId) => {
        if (!confirm('Bạn có chắc muốn xóa banner này?')) return;

        try {
            const { data } = await axios.put(`/api/promotion/update/${promotionId}`, {
                bannerImage: '',
                bannerTitle: '',
                bannerSubtitle: '',
                showBanner: false,
                bannerOrder: 0
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                toast.success('Đã xóa banner');
                fetchPromotions();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    // Check if promotion is active
    const isPromotionActiveNow = (promotion) => {
        const now = new Date();
        const start = new Date(promotion.startDate);
        const end = new Date(promotion.endDate);
        return promotion.isActive && now >= start && now <= end;
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Get promotions with banners
    const promotionsWithBanners = promotions.filter(p => p.bannerImage);
    const promotionsWithoutBanners = promotions.filter(p => !p.bannerImage && p.isActive);

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
                <Title text2="Quản lý Banner" />
            </div>

            {/* Active Banners */}
            <div className='mb-8'>
                <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                    <Image className='w-5 h-5 text-purple-400' />
                    Banner đang hiển thị ({promotionsWithBanners.filter(p => p.showBanner && isPromotionActiveNow(p)).length})
                </h3>

                {promotionsWithBanners.length === 0 ? (
                    <div className='text-center py-10 bg-white/5 rounded-xl border border-gray-700'>
                        <Image className='w-12 h-12 mx-auto text-gray-600 mb-3' />
                        <p className='text-gray-400'>Chưa có banner nào</p>
                        <p className='text-gray-500 text-sm mt-1'>Thêm banner cho khuyến mãi bên dưới</p>
                    </div>
                ) : (
                    <div className='grid gap-4'>
                        {promotionsWithBanners.map((promotion, index) => (
                            <div
                                key={promotion._id}
                                className={`p-4 rounded-xl border ${promotion.showBanner && isPromotionActiveNow(promotion)
                                        ? 'border-purple-500/50 bg-purple-500/5'
                                        : 'border-gray-700 bg-white/5 opacity-60'
                                    }`}
                            >
                                <div className='flex gap-4'>
                                    {/* Banner Preview */}
                                    <div className='w-48 h-28 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0'>
                                        <img
                                            src={promotion.bannerImage}
                                            alt={promotion.bannerTitle || promotion.name}
                                            className='w-full h-full object-cover'
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/192x112?text=Error';
                                            }}
                                        />
                                    </div>

                                    {/* Banner Info */}
                                    <div className='flex-1 min-w-0'>
                                        <div className='flex items-center gap-2 mb-1'>
                                            <span className='text-xs px-2 py-0.5 bg-primary/20 text-primary rounded'>
                                                -{promotion.discountPercent}%
                                            </span>
                                            {promotion.showBanner && isPromotionActiveNow(promotion) && (
                                                <span className='text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded'>
                                                    Đang hiển thị
                                                </span>
                                            )}
                                            {!isPromotionActiveNow(promotion) && (
                                                <span className='text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded'>
                                                    KM hết hạn/tắt
                                                </span>
                                            )}
                                            <span className='text-xs text-gray-500'>
                                                Thứ tự: {promotion.bannerOrder}
                                            </span>
                                        </div>
                                        <h4 className='font-semibold truncate'>
                                            {promotion.bannerTitle || promotion.name}
                                        </h4>
                                        {promotion.bannerSubtitle && (
                                            <p className='text-sm text-gray-400 truncate'>{promotion.bannerSubtitle}</p>
                                        )}
                                        <p className='text-xs text-gray-500 mt-1'>
                                            KM: {promotion.name} | {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className='flex items-center gap-2'>
                                        <button
                                            onClick={() => toggleBannerVisibility(promotion._id, promotion.showBanner)}
                                            className={`p-2 rounded-lg transition ${promotion.showBanner
                                                    ? 'text-green-400 hover:bg-green-500/20'
                                                    : 'text-gray-500 hover:bg-gray-700'
                                                }`}
                                            title={promotion.showBanner ? 'Ẩn banner' : 'Hiện banner'}
                                        >
                                            {promotion.showBanner ? <Eye className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(promotion)}
                                            className='p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition'
                                            title='Chỉnh sửa banner'
                                        >
                                            <Pencil className='w-5 h-5' />
                                        </button>
                                        <button
                                            onClick={() => removeBanner(promotion._id)}
                                            className='p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition'
                                            title='Xóa banner'
                                        >
                                            <Trash2 className='w-5 h-5' />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Promotions without banners */}
            <div>
                <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                    <PlusIcon className='w-5 h-5 text-gray-400' />
                    Khuyến mãi chưa có banner ({promotionsWithoutBanners.length})
                </h3>

                {promotionsWithoutBanners.length === 0 ? (
                    <p className='text-gray-500 text-sm'>Tất cả khuyến mãi đang hoạt động đã có banner</p>
                ) : (
                    <div className='grid gap-3'>
                        {promotionsWithoutBanners.map(promotion => (
                            <div
                                key={promotion._id}
                                className='flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 transition'
                            >
                                <div className='flex items-center gap-3'>
                                    <span className='text-lg font-bold text-primary'>-{promotion.discountPercent}%</span>
                                    <div>
                                        <p className='font-medium'>{promotion.name}</p>
                                        <p className='text-xs text-gray-500'>
                                            {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEditModal(promotion)}
                                    className='flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition text-sm'
                                >
                                    <Image className='w-4 h-4' />
                                    Thêm banner
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
                    <div className='bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between p-4 border-b border-gray-700'>
                            <h2 className='text-xl font-bold'>
                                {editingPromotion?.bannerImage ? 'Chỉnh sửa Banner' : 'Thêm Banner'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 hover:bg-gray-700 rounded-lg transition'
                            >
                                <XIcon className='w-6 h-6' />
                            </button>
                        </div>

                        {/* Promotion Info */}
                        {editingPromotion && (
                            <div className='p-4 bg-white/5 border-b border-gray-700'>
                                <p className='text-sm text-gray-400'>Khuyến mãi:</p>
                                <p className='font-semibold'>{editingPromotion.name} (-{editingPromotion.discountPercent}%)</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
                            {/* Banner Image URL */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>
                                    URL hình ảnh Banner <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='url'
                                    value={formData.bannerImage}
                                    onChange={e => setFormData({ ...formData, bannerImage: e.target.value })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                    placeholder='https://example.com/banner.jpg'
                                    required
                                />
                                {formData.bannerImage && (
                                    <div className='mt-2 rounded-lg overflow-hidden border border-gray-700'>
                                        <img
                                            src={formData.bannerImage}
                                            alt='Preview'
                                            className='w-full h-40 object-cover'
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/600x160?text=Invalid+URL';
                                            }}
                                        />
                                    </div>
                                )}
                                <p className='text-xs text-gray-500 mt-1'>Khuyến nghị: Hình ảnh 1920x600 px để hiển thị tốt nhất</p>
                            </div>

                            {/* Banner Title */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>Tiêu đề Banner</label>
                                <input
                                    type='text'
                                    value={formData.bannerTitle}
                                    onChange={e => setFormData({ ...formData, bannerTitle: e.target.value })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                    placeholder='VD: Khuyến mãi Tết 2026 - Giảm ngay 20%'
                                />
                                <p className='text-xs text-gray-500 mt-1'>Để trống sẽ dùng tên khuyến mãi</p>
                            </div>

                            {/* Banner Subtitle */}
                            <div>
                                <label className='block text-sm text-gray-400 mb-1'>Phụ đề Banner</label>
                                <input
                                    type='text'
                                    value={formData.bannerSubtitle}
                                    onChange={e => setFormData({ ...formData, bannerSubtitle: e.target.value })}
                                    className='w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:border-primary outline-none'
                                    placeholder='VD: Áp dụng cho tất cả suất chiếu trong dịp Tết'
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
                                <p className='text-xs text-gray-500 mt-1'>Số nhỏ hơn sẽ hiển thị trước trong slider</p>
                            </div>

                            {/* Show Banner Toggle */}
                            <div className='flex items-center justify-between p-3 bg-white/5 rounded-lg'>
                                <div>
                                    <label className='text-sm font-medium'>Hiển thị Banner</label>
                                    <p className='text-xs text-gray-500'>Hiển thị trên trang chủ người dùng</p>
                                </div>
                                <button
                                    type='button'
                                    onClick={() => setFormData({ ...formData, showBanner: !formData.showBanner })}
                                    className={`p-2 rounded-lg transition ${formData.showBanner ? 'text-green-400 bg-green-500/20' : 'text-gray-500 bg-gray-700'}`}
                                >
                                    {formData.showBanner ? <Eye className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
                                </button>
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
                                    Lưu Banner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListBanners;
