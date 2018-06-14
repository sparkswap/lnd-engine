/**
 *
 * @param {Object} channelPoint
 * @param {String} channelPoint.fundingTxidBytes
 * @param {String} channelPoint.fundingTxidStr
 * @param {String} channelPoint.outputIndex
 * @returns {Promise}
 */
async function updateChannelPolicy (chanPoint, feeRate, { client }) {
  return new Promise((resolve, reject) => {
    client.updateChannelPolicy({ chanPoint, feeRate }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}
funding_txid_bytes 	bytes 	optional 	Txid of the funding transaction
funding_txid_str 	string 	optional 	Hex-encoded string representing the funding transaction
output_index 	uint32 	optional 	The index of the output of the funding transaction

module.exports = updateChannelPolicy
