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

// ✅ Kafka should run independently (with retry)
const startKafka = async () => {
  while (true) {
    try {
      await connectProducer();
      console.log('[Kafka] Producer connected');

      await startNotificationConsumer();
      console.log('[Kafka] Notification consumer started');

      await startAnalyticsConsumer();
      console.log('[Kafka] Analytics consumer started');

      break; // success → exit loop
    } catch (err) {
      console.error('[Kafka] Error, retrying in 5s:', err.message);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

const startServer = async () => {
  try {
    // ✅ Start server FIRST (don’t block)
    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });

    // ✅ Start Kafka in background
    startKafka();

  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
};

startServer();