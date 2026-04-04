import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors'
import helmet from 'helmet';
import MongoStore from 'connect-mongo';
dotenv.config();
import { connectDB } from '../config/db.js';
import authRoutes from './routes/authRoutes.js'
import alertRoutes from './routes/alertRoutes.js'
import { protect } from './middleware/authMiddleware.js';
import passport from 'passport';
import session from 'express-session'
import phoneVerificationRoutes from './routes/phoneVerificationRoutes.js'

// Only connect if MONGO_URI exists
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file!');
  process.exit(1);
}

connectDB()

const app = express()

// Security headers
app.use(helmet());

// CORS must be defined BEFORE routes for preflight requests to work
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173", // local dev fallback
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Automatically allow ANY Vercel preview link!
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json())

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
)

//initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// Routes - must come AFTER CORS middleware
app.use('/api/auth', authRoutes);
app.use("/api/alerts", alertRoutes);
app.use('/api/verify', phoneVerificationRoutes)


app.get('/api/dashboard', protect, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}` });
});


app.get('/', (req, res) => {
  res.send('Api is running')
})

// Global error handler — must be the LAST middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);

  // Keep Render Awake by pinging its own '/' route every 14 minutes so it never hits the 15-minute sleep threshold
  const RENDER_URL = 'https://fakebankalert-app-1.onrender.com';
  setInterval(() => {
    fetch(RENDER_URL)
      .then(res => console.log(`[Keep-Alive] Pinged ${RENDER_URL} - Status: ${res.status}`))
      .catch(err => console.error(`[Keep-AliveError] Ping failed:`, err.message));
  }, 14 * 60 * 1000); // 14 minutes in milliseconds
});