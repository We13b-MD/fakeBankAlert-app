import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { startPhoneVerification,confirmPhoneVerification } from "../controllers/phoneVerificationController.js"

const router = express.Router()

router.post('/start', protect, startPhoneVerification)
router.post('/confirm', protect, confirmPhoneVerification)
router.get('/test', (req, res) => {
  res.json({ ok: true });
});

export default router;