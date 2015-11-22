var IPCEE = require('../../')
var ipc = IPCEE(process)

ipc.on('server', function(server) {
   if(!(server instanceof require('net').Server))
    throw new Error('not a server')
   else
    ipc.send('ok')
})
