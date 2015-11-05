var IPCEE = require('../../')

var ipc = IPCEE(process, {wildcard: true})

ipc.send('started')

ipc.on('ping', function() {
 ipc.send('pong') 
})

ipc.on('ping.me', function() {
  ipc.send('me.pong')
})
