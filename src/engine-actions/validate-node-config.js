const { getInfo } = require('../lnd-actions')

/**
 * Validates this engine's configuration against the node it is
 * hooked up to. Sets the engine validated flag to true if all validations pass.
 *
 * @function
 * @return {void}
 */
async function validateNodeConfig () {
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

  this.validated = true
}

module.exports = validateNodeConfig
