const kafka = require('../../config/kafka');
const prisma = require('../../config/db');
const redis = require('../../config/redis');

let io;
const getIOSafe = () => {
  if (!io) {
    try { io = require('../../config/socket').getIO(); } catch (_) {}
  }
  return io;
};

const consumer = kafka.consumer({ groupId: 'notification-service' });

const startNotificationConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topics: ['doubt-events', 'reply-events', 'vote-events'],
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        const { event, data } = payload;

        let notification = null;

        if (event === 'reply-added' && data.doubtAuthorId !== data.replyAuthorId) {
          notification = await prisma.notification.create({
            data: {
              userId: data.doubtAuthorId,
              type: 'REPLY_RECEIVED',
              message: `${data.replyAuthorName} replied to your doubt`,
              referenceId: data.doubtId,
              referenceType: 'doubt'
            }
          });
        }

        if (event === 'reply-upvoted') {
          notification = await prisma.notification.create({
            data: {
              userId: data.replyAuthorId,
              type: 'VOTE_RECEIVED',
              message: `${data.voterName} upvoted your reply`,
              referenceId: data.replyId,
              referenceType: 'reply'
            }
          });
        }

        if (event === 'answer-accepted') {
          notification = await prisma.notification.create({
            data: {
              userId: data.replyAuthorId,
              type: 'ANSWER_ACCEPTED',
              message: 'Your answer was accepted as the best solution! 🎉',
              referenceId: data.doubtId,
              referenceType: 'doubt'
            }
          });
        }

        if (notification) {
          const socketInstance = getIOSafe();
          if (socketInstance) {
            const socketId = await redis.get(`socket:${notification.userId}`);
            if (socketId) {
              socketInstance.to(socketId).emit('notification', notification);
            } else {
              socketInstance.to(`user:${notification.userId}`).emit('notification', notification);
            }
          }
        }
      } catch (err) {
        console.error('[NotificationConsumer] Error processing message:', err.message);
      }
    }
  });

  console.log('[Kafka] Notification consumer running');
};

module.exports = { startNotificationConsumer };