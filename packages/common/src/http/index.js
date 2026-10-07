module.exports = {
  ...require('./create-base-app'),
  ...require('./error-handler'),
  ...require('./validate'),
  ...require('./auth'),
};
