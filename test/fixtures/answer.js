process.on('message', function(d) {
  process.send(d)
})

var Socket = require('net').Socket

//coverage to emit the socket 
//ipcee handles arrays and transform them to arguments
var sock = new Socket()
process.send('message', sock)
