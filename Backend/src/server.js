import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors'
dotenv.config();
import { connectDB } from '../config/db.js';
import authRoutes from './routes/authRoutes.js'
import alertRoutes from './routes/alertRoutes.js'
import { protect } from './middleware/authMiddleware.js';
import passport from 'passport';
import session from 'express-session'
import phoneVerificationRoutes from './routes/phoneVerificationRoutes.js'


console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID); // ✅ Add this
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET); // ✅ Add this


// Load environment variables
dotenv.config();

// Debug: Check if env variables are loaded
console.log('Environment Check:');
console.log('MONGO_URI:', process.env.MONGO_URI);


// Only connect if MONGO_URI exists
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file!');
  process.exit(1);
}

connectDB()

const app = express()

// CORS must be defined BEFORE routes for preflight requests to work
const allowedOrigins = [
  "http://localhost:5173", // frontend dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
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



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`))
//Backend/.env  (NOT Backend/src/.env)