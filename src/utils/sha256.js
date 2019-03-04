const { createHash } = require('crypto')

/**
 * Generate a hash from a preimage
 * @param {string} preimage - Base64 string of the preimage data
 * @returns {string} Base64 string of the derived hash
 */
function hash (preimage) {
  const sha256 = createHash('sha256')
  const preimageBuf = Buffer.from(preimage, 'base64')
  return sha256.update(preimageBuf).digest('base64')
}

module.exports = {
  hash
}
