import rateLimit from 'express-rate-limit';

// Auth routes: 10 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Alert detection routes: 20 requests per 15 minutes
// Protects against OpenAI API cost abuse
export const alertLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many detection requests. Please wait before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});