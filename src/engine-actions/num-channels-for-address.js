const getChannelsForRemoteAddress = require('./get-channels-for-remote-address')

/**
 * Returns a number of channels that have the remotePubkey
 * @param {string} address - Payment channel network address
 * @returns {number} number of active and pending channels
 */
async function numChannelsForAddress (address) {
  const channelsForAddress = await getChannelsForRemoteAddress.call(this, address)

  return channelsForAddress.length
}

module.exports = numChannelsForAddress
