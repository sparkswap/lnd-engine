/**
 * Load Proto
 * @module src/utils/load-proto
 */

const grpc = require('grpc')
const grpcProtoLoader = require('@grpc/proto-loader')

/**
 * Default values for grpc/proto-loader that mimic the default behaivor
 * of grpc.
 *
 * @function
 * @param {string} basePath - path to lnrpc directory
 * @returns {Object}
 */
function getGrpcOptions (basePath) {
  return {
    longs: String,
    bytes: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [
      basePath
    ]
  }
}

/**
 * Generates a proto definition for a specified proto file path
 *
 * @function
 * @private
 * @param {string} basePath - lnrpc directory path
 * @param {string[]} relativePaths - path to proto file within basePath
 * @returns {Object}
 * @throws {Error} proto file not found
 */
function loadProto (basePath, relativePaths) {
  const options = getGrpcOptions(basePath)
  const packageDefinition = grpcProtoLoader.loadSync(relativePaths, options)
  return grpc.loadPackageDefinition(packageDefinition)
}

module.exports = loadProto
