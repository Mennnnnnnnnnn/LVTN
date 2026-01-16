import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import {
    getAllPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    getActivePromotions,
    togglePromotionStatus,
    getPromotionBanners
} from '../controllers/promotionController.js';

const promotionRouter = express.Router();

// Public routes
promotionRouter.get('/active', getActivePromotions);
promotionRouter.get('/banners', getPromotionBanners);

// Admin routes
promotionRouter.get('/all', protectAdmin, getAllPromotions);
promotionRouter.post('/create', protectAdmin, createPromotion);
promotionRouter.put('/update/:promotionId', protectAdmin, updatePromotion);
promotionRouter.delete('/delete/:promotionId', protectAdmin, deletePromotion);
promotionRouter.patch('/toggle/:promotionId', protectAdmin, togglePromotionStatus);

export default promotionRouter;
