/**
 * LND Engine REPL
 */
const repl = require('repl')

const { LndEngine } = require('../src')

const replServer = repl.start({
  prompt: 'LND (engine) > '
})

replServer.context.Engine = new LndEngine()
