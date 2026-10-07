const { startConsumer, TOPICS } = require('@fitness/common');
const config = require('../../config');
const logger = require('../../config/logger');
const pool = require('../../db/pool');
const kafka = require('../kafka');
const memberHandlers = require('./member.handlers');
const bookingHandlers = require('./booking.handlers');

function startConsumers({ producer }) {
  return startConsumer({
    kafka,
    groupId: config.kafka.groupId,
    topics: [TOPICS.MEMBER_EVENTS, TOPICS.BOOKING_EVENTS],
    handlers: { ...memberHandlers, ...bookingHandlers },
    pool,
    producer,
    logger,
  });
}

module.exports = { startConsumers };
