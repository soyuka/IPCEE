var fork = require('child_process').fork
var expect = require('chai').expect
var p = require('path')
var IPCEE = require('../index.js')
var answer, ipc, server

describe('IPCEE', function() {
  
  it('should fork', function() {
    answer = fork(p.join(__dirname, './fixtures/answer.js'))
    client = IPCEE(answer)
  })

  it('should get message through client', function(cb) {
   client.once('test', function(x, y) {
     expect(x).to.deep.equal({foo: 'bar'})
     expect(y).to.deep.equal([0,1,2])
    cb() 
   }) 

   client.send('test', {foo: 'bar'}, [0,1,2])
  })

  it('should not be available because child has been killed', function(cb) {
   answer.kill()

   answer.once('exit', function() {
     expect(client.client).to.be.undefined
     cb()
   })
  })

  it('should fork server', function(cb) {
   server = fork(p.join(__dirname, './fixtures/server.js'))
   client = IPCEE(server)

   client.once('started', cb)
  })

  it('should ping-pong', function(cb) {
    client.once('pong', cb)

    client.send('ping')
  })


})
