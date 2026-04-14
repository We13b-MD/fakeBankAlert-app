import express from 'express';
import { createAlert, getUserAlerts, detectTextAlert, detectImageAlert, getDashboardStats, getRecentAlertDetails } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { requirePhoneVerified } from '../middleware/requiredPhoneverified.js';
import { alertLimiter } from '../middleware/rateLimiter.js';

const router = express.Router()
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.post('/create', protect, requirePhoneVerified, alertLimiter, createAlert);
router.get('/my-alerts', protect, getUserAlerts);
router.post("/detect-text", protect, requirePhoneVerified, alertLimiter, detectTextAlert);
router.post(
  '/detect-image',
  protect,
  requirePhoneVerified,
  alertLimiter,
  upload.single('image'),
  detectImageAlert
);
router.get('/dashboard/stats', protect, getDashboardStats);
router.get('/dashboard/recent', protect, getRecentAlertDetails);

export default router;
