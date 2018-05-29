const { getInfo: gi } = require('../lnd-actions')

async function getInfo () {
  return gi({ client: this.client })
}

module.exports = getInfo
