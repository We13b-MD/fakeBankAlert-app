import express from 'express';
import { createAlert, getUserAlerts, detectTextAlert, detectImageAlert, getDashboardStats, getRecentAlertDetails } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

import { requirePhoneVerified } from '../middleware/requiredPhoneverified.js';

const router = express.Router()
const upload = multer({ dest: 'uploads/' });
router.post('/create', protect, requirePhoneVerified, createAlert);
router.get('/my-alerts', protect, getUserAlerts);
router.post("/detect-text", protect, requirePhoneVerified, detectTextAlert);
//router.post('/detect-image', protect,/*requirePhoneVerified,*/ upload.single('image'), detectImageAlert);   
router.post(
  '/detect-image',
  protect,
  requirePhoneVerified,
  upload.single('image'),
  detectImageAlert
);
router.get('/dashboard/stats', protect, getDashboardStats);
router.get('/dashboard/recent', protect, getRecentAlertDetails);



export default router;
