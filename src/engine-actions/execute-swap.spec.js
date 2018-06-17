const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const executeSwap = rewire(path.resolve(__dirname, 'execute-swap'))

describe('execute-swap', () => {
  describe('routeFromPath', () => {
    let routeFromPath
    let amountToSend
    let finalCLTV
    let path

    beforeEach(() => {
      routeFromPath = executeSwap.__get__('routeFromPath')

      amountToSend = '1000000'
      finalCLTV = 144
      path = [
        {
          fromPubKey: 'mypub',
          toPubKey: 'theirpub',
          channelId: '1234',
          capacity: '10000008',
          policy: {
            feeBaseMsat: '2000',
            feeRateMilliMsat: '7667',
            timeLockDelta: 10
          }
        },
        {
          fromPubKey: 'theirpub',
          toPubKey: 'anotherpub',
          channelId: '4321',
          capacity: '20000000',
          policy: {
            feeBaseMsat: '1000',
            feeRateMilliMsat: '7667',
            timeLockDelta: 10
          }
        }
      ]
    })

    it('calculates the total time lock', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route).to.have.property('totalTimeLock', 164)
    })

    it('calculates the total fees', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route).to.have.property('totalFeesMsat', '7668000')
    })

    it('calculates the total amount to send', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route).to.have.property('totalAmtMsat', '1007668000')
    })

    it('constructs hops', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route).to.have.property('hops')
      expect(route.hops).to.be.an('array')
      expect(route.hops).to.have.lengthOf(2)
    })

    it('includes channel id in the hop', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route.hops[0]).to.have.property('chanId', '1234')
      expect(route.hops[1]).to.have.property('chanId', '4321')
    })

    it('includes channel capacity in the hop', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route.hops[0]).to.have.property('chanCapacity', '10000008')
      expect(route.hops[1]).to.have.property('chanCapacity', '20000000')
    })

    it('includes expiry in the hop', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route.hops[0]).to.have.property('expiry', 154)
      expect(route.hops[1]).to.have.property('expiry', 144)
    })

    it('includes the amount to forward in the hop', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route.hops[0]).to.have.property('amtToForwardMsat', '1000000000')
      expect(route.hops[1]).to.have.property('amtToForwardMsat', '1000000000')
    })

    it('includes the fee in the hop', () => {
      const route = routeFromPath(amountToSend, finalCLTV, path)

      expect(route.hops[0]).to.have.property('feeMsat', '7668000')
      expect(route.hops[1]).to.have.property('feeMsat', '0')
    })
  })

  describe('computeFee', () => {
    let computeFee
    let amount
    let policy

    beforeEach(() => {
      computeFee = executeSwap.__get__('computeFee')

      amount = '1000000'
      policy = {
        feeBaseMsat: '1000',
        feeRateMilliMsat: '1000'
      }
    })

    it('computes the fee', () => {
      const fee = computeFee(amount, policy)

      expect(fee).to.be.eql('2000')
    })

    it('rounds up', () => {
      amount = '1000100'
      const fee = computeFee(amount, policy)

      expect(fee).to.be.eql('2001')
    })
  })

  describe('getBandwidthHints', () => {
    let getBandwidthHints
    let channels
    let pubkey

    beforeEach(() => {
      getBandwidthHints = executeSwap.__get__('getBandwidthHints')

      pubkey = 'mypubkey'

      channels = [
        {
          chanId: 'chan1',
          remotePubkey: 'anotherpubkey',
          localBalance: '1000000',
          remoteBalance: '90',
          active: true
        },
        {
          chanId: 'chan2',
          remotePubkey: 'theirpubkey',
          active: true,
          localBalance: '87777',
          remoteBalance: '56556'
        }
      ]
    })

    it('produces hints for every channel we are party to', () => {
      const hints = getBandwidthHints(channels, pubkey)

      expect(Object.keys(hints)).to.have.lengthOf(2)
    })

    it('skips channels that are inactive', () => {
      channels.push({ chanId: 'chan3', active: false })
      const hints = getBandwidthHints(channels, pubkey)

      expect(Object.keys(hints)).to.have.lengthOf(2)
    })

    it('assigns hints to the channel id', () => {
      const hints = getBandwidthHints(channels, pubkey)

      expect(hints).to.have.property('chan1')
      expect(hints).to.have.property('chan2')
    })

    it('assigns balances to the right pubkeys', () => {
      const hints = getBandwidthHints(channels, pubkey)

      expect(hints.chan1).to.be.eql({
        mypubkey: '1000000',
        anotherpubkey: '90'
      })
      expect(hints.chan2).to.be.eql({
        mypubkey: '87777',
        theirpubkey: '56556'
      })
    })
  })

  describe('findPaths', () => {
    let findPaths
    let edges
    let hints
    let fromPubKey
    let toPubKey
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
          feeBaseMsat: '1000',
          feeRateMilliMsat: '7667',
          minHtlc: '144',
          timeLockDelta: 9
        }
      })
      expect(path[1]).to.be.eql({
        fromPubKey: 'theirpub',
        toPubKey: 'anotherpub',
        channelId: '4321',
        capacity: '20000000',
        policy: {
          feeBaseMsat: '1000',
          feeRateMilliMsat: '7667',
          minHtlc: '144',
          timeLockDelta: 9
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
      expect(channel.policy).to.be.eql(edges[1].node1Policy)
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

    it('returns LTC if one channel is not on the same page', () => {
      node2Policy.feeRateMilliMsat = '1000'

      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.equal('LTC')
    })

    it('returns undefined if no symbol is defined', () => {
      node2Policy.feeRateMilliMsat = '1000'
      node1Policy.feeRateMilliMsat = '1000'

      expect(getChannelSymbol(node1Policy, node2Policy)).to.be.undefined()
    })

    it('throws if the channels disagree', () => {
      node1Policy.feeRateMilliMsat = '6667'

      expect(() => { getChannelSymbol(node1Policy, node2Policy) }).to.throw('disagree')
    })
  })
})
