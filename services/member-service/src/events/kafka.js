const { createKafkaClient } = require('@fitness/common');
const config = require('../config');
const logger = require('../config/logger');

module.exports = createKafkaClient({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  logger,
});
