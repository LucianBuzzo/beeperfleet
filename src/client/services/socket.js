const uuidV4 = require('uuid/v4')
const _ = require('lodash')
const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'http://localhost:8080'
const socket = require('socket.io-client')(SERVER_ADDRESS)

const store = require('./store')
const clientUUID = uuidV4()

const emit = (channel, payload) => {
  const data = _.assign(payload, { id: clientUUID })
  socket.emit(channel, data)
}

const on = (event, fn) => {
  socket.on(event, fn)
}

on('connect', () => {
  console.log('connected')
  emit('initialise', {
    layers: store.getState().toJS().layers,
  })
})

module.exports = {
  emit,
  on,
}
