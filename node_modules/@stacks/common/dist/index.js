
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./common.cjs.production.min.js')
} else {
  module.exports = require('./common.cjs.development.js')
}
