const {
  getInfo,
  isEngineUnlocked
} = require('../lnd-actions')

/**
 * Validates this engine's configuration against the node it is
 * hooked up to.
 *
 * @function
 * @return {Boolean} Node is configured correctly
 * @throws {Error} LND has no chains configured
 * @throws {Error} LND can only support one active chain at a time
 * @throws {Error} Mismatched configuration if chain is different than engine configuration
 */
async function validateNodeConfig () {
  const isUnlocked = await isEngineUnlocked.call(this)

  if (!isUnlocked) {
    // If the engine is not unlocked then the subsequent call to getInfo
    // will fail, so instead we will just return and have the application
    // handle this case
    this.logger.warn(`LND ENGINE - Engine for ${this.symbol} is not unlocked`)
    return false
  }

  const { chains = [] } = await getInfo({ client: this.client })

  if (chains.length === 0) {
    throw new Error('LND has no chains configured.')
  }

  if (chains.length > 1) {
    throw new Error(`LndEngine can support an LND instance with at most one chain active. Found: ${chains}`)
  }

  const [ chainName ] = chains

  if (chainName !== this.currencyConfig.chainName) {
    throw new Error(`Mismatched configuration: Engine is configured for ${this.currencyConfig.chainName}, LND is configured for ${chainName}.`)
  }

  return true
}

module.exports = validateNodeConfig
