const { createPool } = require('@fitness/common');
const config = require('../config');
const logger = require('../config/logger');

module.exports = createPool({ connectionString: config.db.url, logger });
