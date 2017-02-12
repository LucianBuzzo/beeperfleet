var express = require('express')()
var http = require('http').Server(express)
var io = require('socket.io')(http)
const { ipcRenderer } = require('electron')
const Immutable = require('immutable')
const redux = require('redux')
const _ = require('lodash')

const audioContext = new AudioContext()
const Synthesizer = require('./synthesizer')

const synthMap = {}

// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16

const BPM = 120

const ADD_LAYER = 'ADD_LAYER'
const INITIALISE = 'INITIALISE'
const UPDATE_SEQUENCE = 'UPDATE_SEQUENCE'
const REMOVE_CLIENT = 'REMOVE_CLIENT'

let currentStep = 0

ipcRenderer.on('clientConnect', (event, arg) => {
  console.log(arg)
})

const reducer = (state, action) => {
  if (!state) {
    state = Immutable.fromJS({
      clients: {}
    })
  }

  switch (action.type) {
    case INITIALISE:
      let { id, layers } = action
      return state.setIn(['clients', id], Immutable.fromJS(layers))
    case UPDATE_SEQUENCE:
      return state.setIn(['clients', action.id, action.layer, 'sequence', action.tile, action.prop], action.value)
    case ADD_LAYER:
      return state.updateIn(['clients', action.id], layers => layers.push(Immutable.fromJS(action.value)))
    case REMOVE_CLIENT:
      return state.deleteIn(['clients', action.id])
    default:
      return state
  }
}

let store = redux.createStore(reducer)

io.on('connection', (socket) => {
  console.log('a client connected')
  let localUUID

  socket.on('initialise', (data) => {
    console.log(data)
    localUUID = data.id

    synthMap[localUUID] = new Synthesizer(audioContext)

    store.dispatch({
      type: INITIALISE,
      id: data.id,
      layers: data.layers
    })
  })

  socket.on(UPDATE_SEQUENCE, (data) => {
    console.log(data)
    store.dispatch({
      type: UPDATE_SEQUENCE,
      id: data.id,
      layer: data.layer,
      tile: data.tile,
      prop: data.prop,
      value: data.value
    })
  })

  socket.on(ADD_LAYER, (data) => {
    store.dispatch({
      type: ADD_LAYER,
      id: data.id,
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
      type: REMOVE_CLIENT,
      id: localUUID
    })

    synthMap[localUUID].destroy()
    delete synthMap[localUUID]
  })
})

http.listen(8080, () => {
  console.log('listening on *:8080')
})

const tick = () => {
  io.sockets.emit('heartbeat', currentStep)
  let clients = store.getState().get('clients').toJS()

  _.forOwn(clients, (layers, uuid) => {
    layers.forEach((layer) => {
      if (layer.sequence[currentStep].active) {
        let { pitch, gain, length } = layer.sequence[currentStep]
        // Add the zero to create a new variable instead of a reference
        pitch = pitch + 0
        synthMap[uuid].noteOn(pitch, gain)

        setTimeout(() => synthMap[uuid].noteOff(pitch), length)
      }
    })
  })

  currentStep++
  if (currentStep >= SEQUENCE_LENGTH) {
    currentStep = 0
  }
}

setInterval(() => {
  tick()
}, 60000 / (BPM * 4))

