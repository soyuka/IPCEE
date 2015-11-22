# IPC EE [![Build Status](https://travis-ci.org/soyuka/IPCEE.svg?branch=master)](https://travis-ci.org/soyuka/IPCEE)

IPC combined with [EventEmitter2](https://github.com/asyncly/EventEmitter2)

## What for?

First, [RTFM child.send(message[, sendHandle])](https://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle).

> The sendHandle option to child.send() is for sending a TCP server or socket object to another process. The child will receive the object as its second argument to the message event.

This means that you won't be able to do things like:

```javascript
child.send('message', {some: 'data'}, [data])
```

[List of accepted instances](https://github.com/joyent/node/blob/9010dd26529cea60b7ee55ddae12688f81a09fcb/lib/child_process.js#L436). If you look a but further in the code, internal messages are sent with the [first argument]([](https://github.com/joyent/node/blob/9010dd26529cea60b7ee55ddae12688f81a09fcb/lib/child_process.js#L430)
). As stated in the docs:

> There is a special case when sending a {cmd: 'NODE_foo'} message.

Then, I thought it could be nice to do:

#### Child
```javascript
ipc.send('started')
```

#### Master
```javascript
var child = fork('child')
child.once('started', dosomething)
```

Internally I just had to combine EventEmitter and use the first argument to pass an array of arguments.

## Usage

### Child

```javascript
  var ipc = IPCEE(process)

  ipc.send('started')

  ipc.on('ping', function() {
    ipc.send('pong') 
  })
```

### Master

```javascript
  var server = fork('some/node/app.js')
  var client = IPCEE(server)

  client.once('started', function() {
    client.send('ping')
  })

  client.once('*.pong', function() {
    console.log('\o/')
  })
```

Or with namespaces:

### Child

```javascript
  var ipc = IPCEE(process, {wildcard: true})

  ipc.send('started')

  ipc.on('ping:me', function() {
    ipc.send('me:pong')
  })
```

### Master

```javascript
  var server = fork('some/node/app.js')
  var client = IPCEE(server, {wildcard: true})

  client.once('started', function() {
    client.send('ping.*')
  })

  client.once('*.pong', function() {
    console.log('\o/') 
  })
```

## Caveat

Using the first argument of [child_process.send()](https://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle), Nodejs IPC will transport strings. Javascript objects are encoded with json internally. That said, You won't be able to pass instances.

Example:
```javascript
process.on('uncaughtException', function(err) {
  ipc.send('error', err.toString(), err.stack)

  process.nextTick(function() {
    process.exit(1) 
  })
})
```

Here, Temptation would be to send the full Error object but `JSON.stringify(new Error('test')`) will return `'{}'`.

## Native IPC features

IPCEE does **not** override any of the internals methods. This means that you'll still be able to get messages from the standard way:

```
process.on('message', function(m, handle) {
  if(m === 'server') {
    //do something with handle 
  }
})
```

But it will handle accepted instances in an easy way too. For example, sending a Socket:

```
//server.js
ipc.send('socket', sock)
//child.js
ipc.on('socket', function(sock) {
  assert(sock instanceof Socket)
})
```

### Licence

> The MIT License (MIT)
> 
> Copyright (c) 2015 Antoine Bluchet
> 
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
