var IPCEE = require('../../')

var ipc = IPCEE(process)

ipc.send('started')

ipc.on('ping', function() {
  return 'pong'
})
