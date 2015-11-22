'use strict';
var assert = require('assert')
var util = require('util')
var EE = require('eventemitter2').EventEmitter2
var debug = require('debug')('IPCEE')

const ACCEPT_HANDLES = [
  require('net').Socket, 
  require('net').Server,
  process.binding('pipe_wrap').Pipe, 
  process.binding('tcp_wrap').TCP, 
  process.binding('udp_wrap').UDP,
  require('dgram').Socket, 
]

function isHandle(handle) {
  for(let i in ACCEPT_HANDLES) {
    if(handle instanceof ACCEPT_HANDLES[i]) 
      return true
  }

  return false
}

/**
 * @param ChildProcess child_process an instantiated child process that supports ipc
 * @param object options EventEmitter2 options https://github.com/asyncly/EventEmitter2
 * @throws AssertionError if ipc is not enabled
 */
function IPCEE(child_process, options) {

  if(!(this instanceof IPCEE)) { return new IPCEE(child_process, options) }

  assert(child_process.hasOwnProperty('send'), 'IPC is not enabled')

  this.client = child_process

  this._hookEvents()

  //eventemitter2 wants an error event to be registered
  this.on('error', function() {})

  EE.call(this, options)
}

util.inherits(IPCEE, EE)

/**
 * Replicate the child_process.send with an array of arguments
 * @param mixed
 * @return this
 */
IPCEE.prototype.send = function() {
 let args = [].slice.call(arguments)
 let callback = args.slice(-1)[0]

 if(isHandle(args[1])) {
    if(typeof callback == 'function') {
      this.client.send(args[0], args[1], callback) 
    } else {
      this.client.send(args[0], args[1]) 
    }
 } else {
   if(typeof callback == 'function') {
     args.pop()
     this.client.send(args, callback)
   } else {
     this.client.send(args)
   }
 }

 return this
}

/**
 * Replicate the child_process.on('message') by taking an array of arguments
 * @param array args
 * @return this
 */
IPCEE.prototype.onmessage = function(args) {
  if(util.isArray(args)) {
    debug('Received message', args)
    //emit the real event (args[0]) with arguments
    this.emit.apply(this, args)

    return this
  }

  //no array, events have a handle, emit args[0] with the handle
  let realArgs = [].slice.call(arguments)
  this.emit.apply(this, realArgs)

  return this
}

/**
 * Replicate the exit event and clean IPCEE events
 * @param integer code
 * @return void
 */
IPCEE.prototype.onexit = function(code) {
  debug('Process exited with code %d', code)
  this._removeEvents()
  this.emit('exit', code)
  delete this.client
}

/**
 * Add listeners (message and exit)
 * @return void
 */
IPCEE.prototype._hookEvents = function() {
  this.client.addListener('message', this.onmessage.bind(this))
  this.client.addListener('exit', this.onexit.bind(this))
}

/**
 * Remove listeners (message and exit)
 * @return void
 */
IPCEE.prototype._removeEvents = function() {
  this.client.removeListener('message', this.onmessage.bind(this))
  this.client.removeListener('exit', this.onexit.bind(this))
}

module.exports = IPCEE
