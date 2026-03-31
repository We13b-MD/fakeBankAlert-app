import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

// Generate JWT
function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )
}

// Register User
export const registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Check if the user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const user = await User.create({
            name: fullName,
            email,
            password: hashedPassword,
        })

        const token = generateToken(user)

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email/Username and password are required" });
        }

        // Escape special regex characters to prevent ReDoS attacks
        const escapedInput = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Search by EITHER email OR name (case-insensitive)
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase().trim() },
                { name: { $regex: new RegExp(`^${escapedInput}$`, 'i') } }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' })
        }

        // Check if user has password (not a Google-only user)
        if (!user.password) {
            return res.status(400).json({
                message: 'This account uses Google Sign-In. Please login with Google.'
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' })
        }

        const token = generateToken(user);
        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: err.message })
    }
}


// Google OAuth Authentication
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    },

        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleEmail = profile.emails[0].value;

                // First, check if user exists with this googleId
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // If not found by googleId, check if user exists with this email
                    user = await User.findOne({ email: googleEmail });

                    if (user) {
                        // User exists with email but not linked to Google — link them
                        user.googleId = profile.id;
                        user.googleEmail = googleEmail;
                        user.avatar = user.avatar || profile.photos[0]?.value;
                        user.isEmailVerified = true;
                        await user.save();
                    } else {
                        // Brand new user — create account
                        user = await User.create({
                            googleId: profile.id,
                            name: profile.displayName,
                            googleEmail: googleEmail,
                            email: googleEmail,
                            avatar: profile.photos[0]?.value,
                            isEmailVerified: true,
                        });
                    }
                }

                return done(null, user);
            } catch (err) {
                console.error('Google auth error:', err);
                return done(err, null);
            }
        }
    )
)

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id)
})

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null)
    }
})


export const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
});

// Google Callback
export const googleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {

        if (err || !user) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
        }

        const token = generateToken(user);
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    })(req, res, next);
};