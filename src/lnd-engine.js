const path = require('path')
const fs = require('fs')

const { proto } = require('./utils')
const { loadProtoFile } = proto
const { generateCredentials } = require('./lnd-credentials')

// ex: https://my.lightning.com:10009
const { LND_HOST } = process.env
const PROTO_PATH = path.resolve('./proto/lnd-rpc.proto')

if (!fs.existsSync(PROTO_PATH)) {
  throw new Error('LND-ENGINE error: Proto file not found')
}

if (!LND_HOST) {
  throw new Error('LND_ENGINE error: Environment variable LND_HOST not set')
}

class LndEngine {
  constructor (logger) {
    this.logger = logger
    this.serviceOptions = {
      'grpc.ssl_target_name_override': 'lnd_btc',
      'grpc.default_authority': 'lnd_btc'
    }
    this.LndRpc = loadProtoFile(PROTO_PATH)
    this.credentials = generateCredentials()
    this.host = LND_HOST

    try {
      this.client = new this.LndRpc.Lightning(this.host, this.credentials, this.serviceOptions)
    } catch (e) {
      this.logger.error('WARNING: LND Engine not implemented yet', { error: e.toString() })
    }
  }
}

module.exports = LndEngine
