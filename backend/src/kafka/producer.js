const kafka = require('../config/kafka');

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
};

const publishEvent = async (topic, payload) => {
  try {
    await producer.send({
      topic,
      messages: [{
        key: payload.data?.doubtId || payload.data?.replyId || 'general',
        value: JSON.stringify(payload)
      }]
    });
    console.log(`[Kafka] Published to ${topic}: ${payload.event}`);
  } catch (err) {
    console.error(`[Kafka] Failed to publish to ${topic}:`, err.message);
    // Intentionally do not throw — Kafka failures should NOT break API responses
  }
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

module.exports = { connectProducer, publishEvent, disconnectProducer };