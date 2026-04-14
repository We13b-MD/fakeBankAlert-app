import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { startPhoneVerification, confirmPhoneVerification } from "../controllers/phoneVerificationController.js"

const router = express.Router()

router.post('/start', protect, startPhoneVerification)
router.post('/confirm', protect, confirmPhoneVerification)


export default router;