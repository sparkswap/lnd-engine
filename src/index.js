const lndEngine = require('./lnd-engine')
const { getInfo } = require('./operational')

module.exports = {
  // This will contain all the methods
  lndEngine,
  getInfo: getInfo.bind(lndEngine)
}
