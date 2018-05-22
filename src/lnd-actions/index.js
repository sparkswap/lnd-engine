const invoices = require('./invoices')
const wallet = require('./wallet')
const health = require('./health')
const info = require('./info')
const balance = require('./balance')

/**
 * Provides a method to deep-copy an object with a certain engine
 *
 * @param {Engine} engine - used for a functions context
 * @param {JS Module} mod - module
 * @return {Object} methods
 */
function register (engine, mod) {
  return Object.keys(mod).reduce((acc, key) => {
    acc[key] = mod[key].bind(engine)
    return acc
  }, {})
}

module.exports = {
  invoices: (engine) => register(engine, invoices),
  wallet: (engine) => register(engine, wallet),
  health: (engine) => register(engine, health),
  info: (engine) => register(engine, info),
  balance: (engine) => register(engine, balance)
}
