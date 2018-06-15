/**
 * Executes a swap as the initiating node
 *
 * @param {String} counterpartyPubKey LN identity_publickey
 * @param {String} swapHash           swap hash that will be associated with the swap
 * @param {Object} inbound            Inbound currency details
 * @param {String} inbound.symbol     Symbol of the inbound currency
 * @param {String} inbound.value      Int64 string of the value of inbound currency
 * @param {Object} outbound           Outbound currency details
 * @param {String} outbound.symbol    Symbol of the outbound currency
 * @param {String} outbound.value     Int64 string of the value of outbound currency
 * @returns {Promise<void>}           Promise that resolves when the swap is settled
 */
async function executeSwap (counterpartyPubKey, swapHash, inbound, outbound) {
  this.logger.info(`Executing swap for ${swapHash} with ${counterpartyPubKey}`, { inbound, outbound })
  // TODO
}

module.exports = executeSwap
