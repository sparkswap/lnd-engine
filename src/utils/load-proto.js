/**
 * Load Proto
 * @module src/utils/load-proto
 */

const grpc = require('grpc')
const grpcProtoLoader = require('@grpc/proto-loader')
const fs = require('fs')

/**
 * Default values for grpc/proto-loader that mimic the default behaivor
 * of grpc.
 *
 * @global
 * @constant
 * @type {Object}
 * @default
 */
const GRPC_OPTIONS = {
  longs: String,
  bytes: String,
  enums: String,
  defaults: true,
  oneofs: true
}

/**
 * Generates a proto definition for a specified proto file path
 *
 * @function
 * @private
 * @param {String} path - lnd protofile path
 * @return {grpc.Object}
 * @throws {Error} proto file not found
 */
function loadProto (path) {
  if (!fs.existsSync(path)) {
    throw new Error(`LND-ENGINE error - Proto file not found at path: ${path}`)
  }

  const packageDefinition = grpcProtoLoader.loadSync(path, GRPC_OPTIONS)
  return grpc.loadPackageDefinition(packageDefinition)
}

module.exports = loadProto
