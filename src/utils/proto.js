const grpc = require('gprc')

const PROTO_FILE_TYPE = 'proto'
const GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true
}

async function loadProtoFile (protoPath) {
  return grpc.load(protoPath, PROTO_FILE_TYPE, GRPC_OPTIONS)
}

module.exports = {
  loadProtoFile
}
