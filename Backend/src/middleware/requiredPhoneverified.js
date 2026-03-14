export const requirePhoneVerified = (req, res, next) => {
    if (!req.user.isPhoneVerified) {
        return res.status(403).json({
            message: 'Please verify your phone to continue',
            code: 'PHONE_VERIFICATION_REQUIRED'
        });
    }
    next();
};
