/* eslint-env mocha */
var fork = require('child_process').fork
var expect = require('chai').expect
var p = require('path')
var IPCEE = require('../index.js')
var client, server

describe('IPCEE', function () {
  afterEach(function () {
    if (server && !server.killed) {
      server.kill()
    }
  })

  it('should throw because ipc is not available', function (cb) {
    try {
      IPCEE({foo: 'bar'})
    } catch (err) {
      expect(err.message).to.equal('IPC is not enabled')
      cb()
    }
  })

  it('should fork', function () {
    server = fork(p.join(__dirname, './fixtures/answer.js'))
    client = IPCEE(server)
  })

  it('should get message through client', function (cb) {
    server = fork(p.join(__dirname, './fixtures/answer.js'))
    client = IPCEE(server)
    client.once('test', function (x, y) {
      expect(x).to.deep.equal({foo: 'bar'})
      expect(y).to.deep.equal([0, 1, 2])
      cb()
    })

    client.send('test', {foo: 'bar'}, [0, 1, 2])
  })

  it('should not be available because child has been killed', function (cb) {
    server = fork(p.join(__dirname, './fixtures/answer.js'))
    client = IPCEE(server)
    server.kill()

    server.once('exit', function () {
      expect(client.client).to.be.an('undefined')
      cb()
    })
  })

  it('should fork server', function (cb) {
    server = fork(p.join(__dirname, './fixtures/pingpong.js'))
    client = IPCEE(server)

    client.once('started', cb)
  })

  it('should ping-pong', function (cb) {
    server = fork(p.join(__dirname, './fixtures/pingpong.js'))
    client = IPCEE(server)
    client.once('pong', cb)

    client.send('ping')
  })

  it('should work with a callback', function (cb) {
    server = fork(p.join(__dirname, './fixtures/pingpong.js'))
    client = IPCEE(server)
    client.send('ping', cb)
  })

  it('should get exit event', function (cb) {
    server = fork(p.join(__dirname, './fixtures/pingpong.js'))
    client = IPCEE(server)
    server.kill()
    client.once('exit', cb)
  })

  it('should get error event', function (cb) {
    server = fork(p.join(__dirname, './fixtures/throw.js'))
    client = IPCEE(server)

    client.once('error', function (err, stack) {
      expect(err).to.equal('Error: Test')
      expect(stack).to.be.a('string')

      client.once('exit', function () {
        return cb()
      })
    })
  })

  it('should work with wildcards', function (cb) {
    server = fork(p.join(__dirname, './fixtures/pingpong.js'))
    client = IPCEE(server, {wildcard: true})

    client.once('*.pong', cb)
    client.send('ping.*')
  })

  it('should send socket', function (cb) {
    var s = require('net').createServer()
    server = fork(p.join(__dirname, './fixtures/socket.js'))
    client = IPCEE(server)

    s.listen(function () {
      client.send('server', s)
      s.close(function () { s.unref() })
    })

    client.once('ok', cb)
  })

  it('should send socket with callback', function (cb) {
    var s = require('net').createServer()
    server = fork(p.join(__dirname, './fixtures/socket.js'))
    client = IPCEE(server)

    s.listen(function () {
      client.send('server', s, cb)
      s.close(function () { s.unref() })
    })
  })
})
