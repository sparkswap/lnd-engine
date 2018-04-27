const grpc = require('grpc')

const PROTO_FILE_TYPE = 'proto'
const GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true
}

async function loadService (path) {
  return grpc.load(path, PROTO_FILE_TYPE, GRPC_OPTIONS)
}

module.exports = { loadService }
