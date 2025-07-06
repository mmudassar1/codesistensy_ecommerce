import express from 'express';
import { getCoupon, validateCoupon } from '../controllers/coupon.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, getCoupon); // Get all coupons
router.post('/validate', protectRoute, validateCoupon); // Validate a coupon by code

export default router;

