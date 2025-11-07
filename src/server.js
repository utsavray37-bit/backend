import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectToDatabase } from './utils/db.js';
import { errorHandler, notFound } from './utils/error.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Allow multiple origins for CORS
const allowedOrigins = [
  'http://localhost:5176',
  'http://localhost:5175',
  'http://localhost:5174',
  'https://frontend-db0d.onrender.com',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Security headers for production
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Library Hub API',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`✨ Library Hub Server running on port ${port}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${port}/api`);
      console.log(`✅ Health check: http://localhost:${port}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
