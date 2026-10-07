const { createLogger } = require('@fitness/common');
const config = require('./index');

module.exports = createLogger(config.serviceName);
