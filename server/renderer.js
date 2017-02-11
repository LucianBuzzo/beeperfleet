var express = require('express')()
var http = require('http').Server(express)
var io = require('socket.io')(http)
const { ipcRenderer } = require('electron')
const Immutable = require('immutable')
const redux = require('redux')
const _ = require('lodash')

const Synthesizer = require('./synthesizer')

const synthMap = {}

// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16

const BPM = 120

const ADD_SEQUENCE = 'ADD_SEQUENCE'
const UPDATE_SEQUENCE = 'UPDATE_SEQUENCE'
const REMOVE_SEQUENCE = 'REMOVE_SEQUENCE'
const UPDATE_SEQUENCE_MIDI = 'UPDATE_SEQUENCE_MIDI'
const UPDATE_SEQUENCE_VOLUME = 'UPDATE_SEQUENCE_VOLUME'
const UPDATE_SEQUENCE_LENGTH = 'UPDATE_SEQUENCE_LENGTH'

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
        seq[action.tile].active = action.value
        return seq
      })
    case UPDATE_SEQUENCE_MIDI:
      return state.updateIn(['sequences', action.id], (seq) => {
        seq[action.tile].midiNumber = action.value
        return seq
      })
    case UPDATE_SEQUENCE_VOLUME:
      return state.updateIn(['sequences', action.id], (seq) => {
        seq[action.tile].volume = action.value
        return seq
      })
    case UPDATE_SEQUENCE_LENGTH:
      return state.updateIn(['sequences', action.id], (seq) => {
        seq[action.tile].length = action.value
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

    synthMap[localUUID] = new Synthesizer()

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

  socket.on('sequenceMidiUpdate', (data) => {
    console.log(data)
    store.dispatch({
      type: UPDATE_SEQUENCE_MIDI,
      id: data.id,
      tile: data.tile,
      value: data.value
    })
  })

  socket.on('sequenceVolumeUpdate', (data) => {
    console.log(data)
    store.dispatch({
      type: UPDATE_SEQUENCE_VOLUME,
      id: data.id,
      tile: data.tile,
      value: data.value
    })
  })

  socket.on('sequenceLengthUpdate', (data) => {
    console.log(data)
    store.dispatch({
      type: UPDATE_SEQUENCE_LENGTH,
      id: data.id,
      tile: data.tile,
      value: data.value
    })
  })

  socket.on('synthFilterCutoffUpdate', (data) => {
    console.log(data)
    synthMap[data.id].updateFilterCutoff(data.value)
  })
  socket.on('synthFilterQUpdate', (data) => {
    console.log(data)
    synthMap[data.id].updateFilterQ(data.value)
  })
  socket.on('synthFilterModUpdate', (data) => {
    console.log(data)
    synthMap[data.id].updateFilterMod(data.value)
  })
  socket.on('synthFilterEnvUpdate', (data) => {
    console.log(data)
    synthMap[data.id].updateFilterEnv(data.value)
  })

  socket.on('disconnect', () => {
    store.dispatch({
      type: REMOVE_SEQUENCE,
      id: localUUID
    })

    delete synthMap[localUUID]
  })
})

http.listen(8080, () => {
  console.log('listening on *:8080')
})

const tick = () => {
  io.sockets.emit('heartbeat', currentStep)
  let sequences = store.getState().get('sequences').toJS()

  _.forOwn(sequences, (sequence, uuid) => {
    if (sequence[currentStep].active) {
      let { midiNumber, volume, length } = sequence[currentStep]
      // Add the zero to create a new variable instead of a reference
      midiNumber = midiNumber + 0
      synthMap[uuid].noteOn(midiNumber, volume)

      setTimeout(() => synthMap[uuid].noteOff(midiNumber), length)
    }
  })

  currentStep++
  if (currentStep >= SEQUENCE_LENGTH) {
    currentStep = 0
  }
}

setInterval(() => {
  tick()
}, 60000 / (BPM * 4))

