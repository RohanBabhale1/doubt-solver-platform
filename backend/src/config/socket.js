const { Server } = require('socket.io');
const redis = require('./redis');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('mark_online', async ({ userId }) => {
      try {
        await redis.sadd('online:users', userId);
        await redis.set(`socket:${userId}`, socket.id, 'EX', 86400);
        socket.data.userId = userId;
        // Join personal notification room
        socket.join(`user:${userId}`);
      } catch (err) {
        console.error('[Socket] mark_online error:', err.message);
      }
    });

    socket.on('mark_offline', async ({ userId }) => {
      try {
        await redis.srem('online:users', userId);
        await redis.del(`socket:${userId}`);
      } catch (err) {
        console.error('[Socket] mark_offline error:', err.message);
      }
    });

    socket.on('join_doubt', ({ doubtId }) => {
      socket.join(`doubt:${doubtId}`);
      console.log(`[Socket] ${socket.id} joined doubt:${doubtId}`);
    });

    socket.on('leave_doubt', ({ doubtId }) => {
      socket.leave(`doubt:${doubtId}`);
    });

    socket.on('typing_start', ({ doubtId, userId, userName }) => {
      socket.to(`doubt:${doubtId}`).emit('user_typing', { userId, userName });
    });

    socket.on('typing_stop', ({ doubtId, userId }) => {
      socket.to(`doubt:${doubtId}`).emit('user_stopped_typing', { userId });
    });

    socket.on('disconnect', async () => {
      const userId = socket.data.userId;
      if (userId) {
        try {
          await redis.srem('online:users', userId);
          const storedSocketId = await redis.get(`socket:${userId}`);
          if (storedSocketId === socket.id) {
            await redis.del(`socket:${userId}`);
          }
        } catch (err) {
          console.error('[Socket] disconnect cleanup error:', err.message);
        }
      }
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };