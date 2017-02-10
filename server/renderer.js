var express = require('express')()
var http = require('http').Server(express)
var io = require('socket.io')(http)
const { ipcRenderer } = require('electron')
const Immutable = require('immutable')
const redux = require('redux')
const Synthesizer = require('./synthesizer')

const synth = new Synthesizer()

console.log(synth)

// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16

const BPM = 160
const NOTE_LENGTH = 100

const ADD_SEQUENCE = 'ADD_SEQUENCE'
const UPDATE_SEQUENCE = 'UPDATE_SEQUENCE'
const REMOVE_SEQUENCE = 'REMOVE_SEQUENCE'

let currentStep = 0

ipcRenderer.on('clientConnect', (event, arg) => {
  console.log(arg)
})

const reducer = (state, action) => {
  if (!state) {
    state = Immutable.fromJS({
      sequences: {}
    })
  }

  switch (action.type) {
    case ADD_SEQUENCE:
      let { id, sequence } = action
      return state.setIn(['sequences', id], sequence)
    case UPDATE_SEQUENCE:
      return state.updateIn(['sequences', action.id], (seq) => {
        seq[action.tile] = action.value
        return seq
      })
    case REMOVE_SEQUENCE:
      return state.deleteIn(['sequences', action.id])
    default:
      return state
  }
}

let store = redux.createStore(reducer)

io.on('connection', (socket) => {
  console.log('a client connected')
  let localUUID

  socket.on('sequence', (data) => {
    console.log(data)
    localUUID = data.id

    store.dispatch({
      type: ADD_SEQUENCE,
      id: data.id,
      sequence: data.sequence
    })
  })

  socket.on('sequenceUpdate', (data) => {
    console.log(data)
    store.dispatch({
      type: UPDATE_SEQUENCE,
      id: data.id,
      tile: data.tile,
      value: data.value
    })
  })

  socket.on('disconnect', () => {
    store.dispatch({
      type: REMOVE_SEQUENCE,
      id: localUUID
    })
  })
})

http.listen(8080, () => {
  console.log('listening on *:8080')
})

const tick = () => {
  io.sockets.emit('heartbeat', currentStep)
  let sequences = store.getState().get('sequences').toArray()
  sequences.forEach(seq => {
    if (seq[currentStep] === 1) {
      console.log('beep')
      synth.noteOn(60, 0.75)

      setTimeout(() => synth.noteOff(60), NOTE_LENGTH)
    }
  })

  currentStep++
  if (currentStep >= SEQUENCE_LENGTH) {
    currentStep = 0
  }
}

setInterval(() => {
  tick()
}, 60000 / BPM)
