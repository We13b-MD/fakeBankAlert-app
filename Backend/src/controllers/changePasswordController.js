import bcrypt from "bcryptjs";
import User from '../models/User.js';

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Both passwords are required' })

        }
        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' })
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        return res.status(200).json({ message: 'Password updated' })

    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}