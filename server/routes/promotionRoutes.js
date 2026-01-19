import express from 'express';
import { protectAdmin, protectRoute } from '../middleware/auth.js';

import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getActivePromotions,
  togglePromotionStatus,
  getPromotionBanners,
  getPromotionBannerDetail,
  getDefaultBanner,
  getAvailablePromotionsForUser,
  checkPromotionForUser
} from '../controllers/promotionController.js';

const promotionRouter = express.Router();

// Public routes
promotionRouter.get('/active', getActivePromotions);
promotionRouter.get('/banners', getPromotionBanners);
promotionRouter.get('/banners/:promotionId', getPromotionBannerDetail);
promotionRouter.get('/default-banner', getDefaultBanner);

// Protected routes (user đăng nhập)
promotionRouter.get('/available-for-user', protectRoute, getAvailablePromotionsForUser);
promotionRouter.get('/check/:promotionId', protectRoute, checkPromotionForUser);

// Admin routes
promotionRouter.get('/all', protectAdmin, getAllPromotions);
promotionRouter.post('/create', protectAdmin, createPromotion);
promotionRouter.put('/update/:promotionId', protectAdmin, updatePromotion);
promotionRouter.delete('/delete/:promotionId', protectAdmin, deletePromotion);
promotionRouter.patch('/toggle/:promotionId', protectAdmin, togglePromotionStatus);

export default promotionRouter;
