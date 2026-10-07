const { startConsumer, TOPICS } = require('@fitness/common');
const config = require('../../config');
const logger = require('../../config/logger');
const pool = require('../../db/pool');
const kafka = require('../kafka');
const memberHandlers = require('./member.handlers');
const classHandlers = require('./class.handlers');

function startConsumers({ producer }) {
  return startConsumer({
    kafka,
    groupId: config.kafka.groupId,
    topics: [TOPICS.MEMBER_EVENTS, TOPICS.CLASS_EVENTS],
    handlers: { ...memberHandlers, ...classHandlers },
    pool,
    producer,
    logger,
  });
}

module.exports = { startConsumers };
