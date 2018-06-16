const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const executeSwap = rewire(path.resolve(__dirname, 'execute-swap'))

describe('execute-swap', () => {
  describe('findPaths', () => {
    let findPaths
    let findOutboundChannels
    let edges
    let hints
    let fromPubKey
    let symbol
    let amount
    let visited

    beforeEach(() => {
      findPaths = executeSwap.__get__('findPaths')

      edges = [
        {
          channelId: '1234',
          chanPoint: '0190019283',
          lastUpdate: 10284012384,
          node1Pub: 'mypub',
          node2Pub: 'theirpub',
          capacity: '10000008',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 9
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 10
          }
        },
        {
          channelId: '4321',
          chanPoint: '019098324283',
          lastUpdate: 10284012374,
          node1Pub: 'theirpub',
          node2Pub: 'anotherpub',
          capacity: '20000000',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 9
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 10
          }
        }
      ]

      hints = {
        '1234': {
          'mypub': '1000000',
          'theirpub': '999000'
        }
      }

      fromPubKey = 'mypub'
      toPubKey = 'anotherpub'
      symbol = 'LTC'
      amount = '2000'

      visited = []
    })

    it('finds a complete path to the destination', () => {
      const path = findPaths(edges, hints, fromPubKey, toPubKey, symbol, amount, visited)

      expect(path).to.be.an('array')
      expect(path).to.have.lengthOf(2)
      expect(path[0]).to.be.eql({
        fromPubKey: 'mypub',
        toPubKey: 'theirpub',
        channelId: '1234',
        capacity: '10000008',
        policy: {
          feeBaseMsat: '2000',
          feeRateMilliMsat: '7667',
          minHtlc: '144',
          timeLockDelta: 10
        }
      })
      expect(path[1]).to.be.eql({
        fromPubKey: 'theirpub',
        toPubKey: 'anotherpub',
        channelId: '4321',
        capacity: '20000000',
        policy: {
          feeBaseMsat: '2000',
          feeRateMilliMsat: '7667',
          minHtlc: '144',
          timeLockDelta: 10
        }
      })
    })

    it('returns undefined if there is no path', () => {
      const path = findPaths(edges, hints, fromPubKey, 'mickeymouse', symbol, amount, visited)

      expect(path).to.be.undefined()
    })
  })

  describe('findOutboundChannels', () => {
    let findOutboundChannels
    let getChannelSymbol
    let edges
    let hints
    let fromPubKey
    let symbol
    let amount
    let visited
    let revert

    beforeEach(() => {
      getChannelSymbol = sinon.stub().returns('LTC')
      revert = executeSwap.__set__('getChannelSymbol', getChannelSymbol)
      findOutboundChannels = executeSwap.__get__('findOutboundChannels')

      edges = [
        {
          channelId: '1234',
          chanPoint: '0190019283',
          lastUpdate: 10284012384,
          node1Pub: 'mypub',
          node2Pub: 'theirpub',
          capacity: '10000008',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 9
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 10
          }
        },
        {
          channelId: '4321',
          chanPoint: '019098324283',
          lastUpdate: 10284012374,
          node1Pub: 'theirpub',
          node2Pub: 'anotherpub',
          capacity: '20000000',
          node1Policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 9
          },
          node2Policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7667',
            minHtlc: '144',
            timeLockDelta: 10
          }
        }
      ]

      hints = {
        '1234': {
          'mypub': '1000000',
          'theirpub': '999000'
        }
      }

      fromPubKey = 'mypub'
      symbol = 'LTC'
      amount = '2000'

      visited = []
    })

    afterEach(() => {
      revert()
    })

    it('provides an array of channels', () => {
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.be.an('array')
    })

    it('returns channels that are connected to this one', () => {
      const channels = findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)

      expect(channels).to.have.lengthOf(1)
      expect(channels[0]).to.have.property('channelId', '1234')
    })

    it('checks bandwidth in the hints', () => {
      hints['1234']['mypub'] = '1000'
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('skips channels that have been visited', () => {
      visited.push('1234')
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('only returns channels for the right symbol', () => {
      symbol = 'BTC'
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('relies on channel capacity for filtering', () => {
      hints = {}
      edges[0].capacity = '10'
      expect(findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)).to.have.lengthOf(0)
    })

    it('constructs a channel', () => {
      const channels = findOutboundChannels(edges, hints, fromPubKey, symbol, amount, visited)
      const channel = channels[0]

      expect(channel).to.have.property('fromPubKey', 'mypub')
      expect(channel).to.have.property('capacity', '10000008')
      expect(channel).to.have.property('channelId', '1234')
      expect(channel).to.have.property('toPubKey', 'theirpub')
      expect(channel).to.have.property('policy')
      expect(channel.policy).to.be.eql(edges[1].node2Policy)
    })
  })

  describe('getChannelSymbol', () => {
    let getChannelSymbol
    let node1Policy
    let node2Policy

    beforeEach(() => {
      getChannelSymbol = executeSwap.__get__('getChannelSymbol')
      node1Policy = {
        feeBaseMsat: '1000',
        feeRateMilliMsat: '7667',
        minHtlc: '144',
        timeLockDelta: 9
      }
      node2Policy = {
        feeBaseMsat: '2000',
        feeRateMilliMsat: '7667',
        minHtlc: '144',
        timeLockDelta: 10
      }
    })

    it('returns LTC for the LTC policy', () => {
      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.equal('LTC')
    })

    it('returns BTC for the BTC policy', () => {
      node1Policy.feeRateMilliMsat = '6667'
      node2Policy.feeRateMilliMsat = '6667'
      expect(getChannelSymbol(node1Policy, node1Policy)).to.be.equal('BTC')
    })

    it('returns empty string for unidentified', () => {
      node2Policy.feeRateMilliMsat = '1000'

      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.equal('')
    })
  })
})
