const kafka = require('../../config/kafka');

const consumer = kafka.consumer({ groupId: 'analytics-service' });

const startAnalyticsConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topics: ['doubt-events', 'reply-events', 'vote-events'],
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        console.log(`[Analytics] ${topic} :: ${payload.event}`, JSON.stringify(payload.data));
        // Future: write to analytics_logs table or external analytics service
      } catch (err) {
        console.error('[AnalyticsConsumer] Error:', err.message);
      }
    }
  });

  console.log('[Kafka] Analytics consumer running');
};

module.exports = { startAnalyticsConsumer };