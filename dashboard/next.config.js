const path = require('path');

module.exports = {
  // Force Next.js to treat the dashboard folder as the tracing root
  outputFileTracingRoot: path.resolve(__dirname),
};
