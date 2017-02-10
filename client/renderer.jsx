'use babel'

const socket = require('socket.io-client')('http://localhost:8080')
const uuidV4 = require('uuid/v4')
const clientUUID = uuidV4()
const React = require('react')
const ReactDOM = require('react-dom')

const SEQUENCE_LENGTH = 16

const sequence = [...Array(SEQUENCE_LENGTH)].map(() => 0)

socket.on('connect', () => {
  console.log('connected')
  socket.emit('clientSequence', {
    id: clientUUID,
    sequence
  })
})

ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
)
