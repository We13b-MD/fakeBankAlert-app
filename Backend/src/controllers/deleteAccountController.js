import User from '../models/User.js';
import Alert from '../models/Alert.js';

export const deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);
        await Alert.deleteMany({ user: req.user._id })
        return res.status(200).json({ message: 'Account deleted successfully' })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}