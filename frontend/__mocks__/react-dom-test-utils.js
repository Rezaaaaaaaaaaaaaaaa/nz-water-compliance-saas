// React 19 doesn't have test-utils, so we mock it
module.exports = {
  act: (callback) => callback(),
};
