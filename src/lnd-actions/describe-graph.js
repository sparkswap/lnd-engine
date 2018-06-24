const { deadline } = require('../grpc-utils')

/**
 * @typedef {Object} LND~ChannelGraph
 * @property {Array} nodes List of Lightning Nodes in the graph
 * @property {Array} edges List of Channel Edges connecting Lightning Nodes in the graph
 */

/**
 * Returns a description of the graph state
 *
 * @param {grpc#client} opts.client
 *
 * @return {Promise<LND~ChannelGraph>}
 */
function describeGraph ({ client }) {
  return new Promise((resolve, reject) => {
    client.describeGraph({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = describeGraph
