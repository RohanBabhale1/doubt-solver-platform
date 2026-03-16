const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'doubt-solver-app',
  brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
  retry: {
    retries: 5,
    initialRetryTime: 300,
    factor: 2
  }
});

module.exports = kafka;