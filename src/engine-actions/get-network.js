const { getInfo } = require('../lnd-actions')

/**
 * Returns the lnd network (e.g. mainnet, regtest, etc)
 *
 * @returns {Promise<string>} network
 */
async function getNetwork () {
  const { chains } = await getInfo({ client: this.client })
  if (chains.length > 1) {
    throw new Error('Cannot grab network from multiple chains.')
  }

  const { network } = chains[0]
  return network
}

module.exports = getNetwork
