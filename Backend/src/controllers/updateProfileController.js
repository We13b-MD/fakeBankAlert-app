import User from '../models/User.js';

export const updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, avatar },
            { new: true }
        );
        return res.status(200).json({
            message: 'Profile updated successfully',
            user
        })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}