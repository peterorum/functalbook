// lambda

const reblog = require('./reblog.js').reblog

exports.handler = function(event, context, callback) {
  reblog().then(() => callback(null, `reblogged`))
}
