const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/doubts', require('./routes/doubtRoutes'));
// app.use('/api/replies', require('./routes/replyRoutes'));
// app.use('/api/votes', require('./routes/voteRoutes'));
// app.use('/api/notifications', require('./routes/notificationRoutes'));
// app.use('/api/subjects', require('./routes/subjectRoutes'));
// app.use('/api/search', require('./routes/searchRoutes'));
// app.use('/api/profile', require('./routes/profileRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Stats endpoints
app.get('/api/stats/platform', async (req, res, next) => {
  try {
    const prisma = require('./config/db');
    const [doubts, replies, users] = await Promise.all([
      prisma.doubt.count(),
      prisma.reply.count(),
      prisma.user.count()
    ]);
    res.json({ doubts, replies, users });
  } catch (err) { next(err); }
});

app.get('/api/stats/online', async (req, res, next) => {
  try {
    const redis = require('./config/redis');
    const count = await redis.scard('online:users');
    res.json({ onlineCount: count });
  } catch (err) { next(err); }
});

// Error middleware (must be last)
app.use(require('./middleware/errorMiddleware'));

module.exports = app;