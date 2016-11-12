# IPC EE [![Build Status](https://travis-ci.org/soyuka/IPCEE.svg?branch=master)](https://travis-ci.org/soyuka/IPCEE)

IPC combined with [EventEmitter2](https://github.com/asyncly/EventEmitter2)

## What for?

First, [RTFM child.send(message[, sendHandle])](https://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle_options_callback).

> The sendHandle option to child.send() is for sending a TCP server or socket object to another process. The child will receive the object as its second argument to the message event.

This means that you won't be able to do things like:

```javascript
child.send('message', {some: 'data'}, [data])
```

This library still works with the [list of accepted instances](https://github.com/nodejs/node/blob/d59917b2a359bf72f12a57ed9a32a3841720b608/lib/internal/child_process.js#L545). Also, if you look a but further in the code, internal messages are handled first. As stated in the docs:

> There is a special case when sending a {cmd: 'NODE_foo'} message.

Things apart, this is a fancier api to communicate with child processes!

Note that I consider this as a low-level module, if you want a higher communication api, take a look at [relieve](https://github.com/soyuka/relieve). I also made a module with the same api using TCP instead of IPC: [TCPEE](https://github.com/soyuka/tcpee).

## Usage

### Test for child start:

#### Child
```javascript
ipc.send('started')
```

#### Master
```javascript
const child = fork('child')
child.once('started', dosomething)
```

#### Play ping pong:

#### Child

```javascript
  const ipc = IPCEE(process)

  ipc.send('started')

  ipc.on('ping', function() {
    ipc.send('pong')
  })
```

#### Master

```javascript
  const server = fork('some/node/app.js')
  const client = IPCEE(server)

  client.once('started', () => {
    client.send('ping')
  })

  client.once('pong', () => {
    console.log('\o/')
  })
```

### Or play with namespaces:

#### Child

```javascript
  const ipc = IPCEE(process, {wildcard: true})

  ipc.send('started')

  ipc.on('ping:me', () => {
    ipc.send('me:pong')
  })
```

#### Master

```javascript
  const server = fork('some/node/app.js')
  const client = IPCEE(server, {wildcard: true})

  client.once('started', () => {
    client.send('ping:*')
  })

  client.once('*:pong', () => {
    console.log('\o/')
  })
```

## Caveat

Using the first argument of [child_process.send()](https://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle), Nodejs IPC will transport strings. Javascript objects are encoded with json [internally](https://github.com/nodejs/node/blob/d59917b2a359bf72f12a57ed9a32a3841720b608/lib/internal/child_process.js#L609). That said, You won't be able to pass instances.

Example:
```javascript
process.on('uncaughtException', err => {
  ipc.send('error', err.toString(), err.stack)

  process.nextTick(() => {
    process.exit(1)
  })
})
```

Here, Temptation would be to send the full Error object but `JSON.stringify(new Error('test')`) will return `'{}'`.

Note, I made a js to string proof of concept [here](https://github.com/soyuka/eviluation), it could work in some cases.

## Native IPC features

IPCEE does **not** override any of the internals methods. This means that you'll still be able to get messages from the standard way:

```js
process.on('message', (m, handle) => {
  if(m === 'server') {
    //do something with handle
  }
})
```

But it will handle accepted instances in an easy way too. For example, sending a Socket:

```js
//server.js
ipc.send('socket', sock)
//child.js
ipc.on('socket', (sock) => {
  assert(sock instanceof Socket)
})
```

## API

```javascript
/**
 * Constructor
 * @param socket - the process/child_process to write/read to/from
 * @param options - eventemitter2 options
 */
const ipcee = new IPCEE(process, {wildcard: true})

/**
 * @param key - the key you'll listen on
 * @param ...args
 */
ipcee.send('key', arg1, arg2)

/**
 * @param key
 * @param ...args data received
 */
ipcee.on('key', function(arg1, arg2) {
})
```

Apart from the `send` method, the api inherits the one of [EventEmitter2](https://github.com/asyncly/EventEmitter2).

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
