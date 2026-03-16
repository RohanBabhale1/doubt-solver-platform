const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/config/socket');
const { connectProducer } = require('./src/kafka/producer');
const { startNotificationConsumer } = require('./src/kafka/consumers/notificationConsumer');
const { startAnalyticsConsumer } = require('./src/kafka/consumers/analyticsConsumer');

require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

const startServer = async () => {
  try {
    await connectProducer();
    console.log('[Kafka] Producer connected');

    await startNotificationConsumer();
    console.log('[Kafka] Notification consumer started');

    await startAnalyticsConsumer();
    console.log('[Kafka] Analytics consumer started');

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
};

startServer();