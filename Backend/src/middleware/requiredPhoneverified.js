export const requirePhoneVerified = (req, res, next) => {
    // SECURITY BYPASS FOR PORTFOLIO DEMO:
    // Termii's strict Nigerian telecom KYC requires massive paperwork to send SMS.
    // To allow interviewers and demo users to test the app instantly, phone verification 
    // restriction is temporarily commented out.

    /*
    if (!req.user.isPhoneVerified) {
        return res.status(403).json({
            message: 'Please verify your phone to continue',
            code: 'PHONE_VERIFICATION_REQUIRED'
        });
    }
    */

    next();
};
