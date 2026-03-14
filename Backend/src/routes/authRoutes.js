import express from 'express'
import { authLimiter } from '../middleware/rateLimiter.js';
import { protect } from '../middleware/authMiddleware.js';


import {
    registerUser,
    loginUser,
    googleAuth,
    googleCallback,
}

    from "../controllers/authController.js"
import { changePassword } from '../controllers/changePasswordController.js';
import { updateProfile } from '../controllers/updateProfileController.js';
import { deleteAccount } from '../controllers/deleteAccountController.js';
const router = express.Router()

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);



// Google Oauth Authentication

router.get('/google', googleAuth); // redirect to google
router.get('/google/callback', googleCallback)  // go back too app

// Get current user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await (await import('../models/User.js')).default.findById(req.user._id).select('-password -phoneVerification');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

//optional management 

router.put('/change-password', protect, changePassword)
router.put('/update-profile', protect, updateProfile)
router.delete('/delete', protect, deleteAccount)

export default router;