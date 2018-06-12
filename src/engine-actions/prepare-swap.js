/**
 * Prepares for a swap in which this node is the counterparty to the intiating node
 *
 * @param {String} swapHash        swap hash that will be associated with the swap
 * @param {Object} inbound         Inbound currency details
 * @param {String} inbound.symbol  Symbol of the inbound currency
 * @param {String} inbound.value   Int64 string of the value of inbound currency
 * @param {Object} outbound        Outbound currency details
 * @param {String} outbound.symbol Symbol of the outbound currency
 * @param {String} outbound.value  Int64 string of the value of outbound currency
 * @returns {String} swapHash      Hash that will be translated
 */
async function prepareSwap (swapHash, inbound, outbound) {
  this.logger.info(`Preparing swap for ${swapHash}`, { inbound, outbound })
  // TODO
  return swapHash
}

module.exports = prepareSwap
