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
const UPDATE_SYNTH = 'UPDATE_SYNTH'
const REMOVE_CLIENT = 'REMOVE_CLIENT'

let currentStep = 0

ipcRenderer.on('clientConnect', (event, arg) => {
  console.log(arg)
})

const reducer = (state, action) => {
  if (!state) {
    state = Immutable.fromJS({
      clients: {},
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

    data.layers.forEach(() => {
      if (!synthMap[localUUID]) {
        synthMap[localUUID] = []
      }
      synthMap[localUUID].push(new Synthesizer(audioContext))
    })

    store.dispatch({
      type: INITIALISE,
      id: data.id,
      layers: data.layers,
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
      value: data.value,
    })
  })

  socket.on(ADD_LAYER, (data) => {
    synthMap[localUUID].push(new Synthesizer(audioContext))
    store.dispatch({
      type: ADD_LAYER,
      id: data.id,
      value: data.value,
    })
  })

  socket.on(UPDATE_SYNTH, (data) => {
    switch (data.prop) {
      case 'filterCutoff':
        synthMap[data.id][data.layer].updateFilterCutoff(data.value)
        break
      case 'filterQ':
        synthMap[data.id][data.layer].updateFilterQ(data.value)
        break
      case 'filterMod':
        synthMap[data.id][data.layer].updateFilterMod(data.value)
        break
      case 'filterEnv':
        console.log('FILTER ENV')
        console.log(data)
        synthMap[data.id][data.layer].updateFilterEnv(data.value)
        break
    }
  })

  socket.on('disconnect', () => {
    store.dispatch({
      type: REMOVE_CLIENT,
      id: localUUID,
    })

    // Allow time for notes to be let off
    setTimeout(() => {
      for (var i = 0; i < synthMap[localUUID].length; i++) {
        synthMap[localUUID][i].destroy()
        delete synthMap[localUUID][i]
      }
    }, 10000)
  })
})

http.listen(8080, () => {
  console.log('listening on *:8080')
})

const tick = () => {
  io.sockets.emit('heartbeat', currentStep)
  let clients = store.getState().get('clients').toJS()

  _.forOwn(clients, (layers, uuid) => {
    layers.forEach((layer, layerIndex) => {
      if (layer.sequence[currentStep].active) {
        let { pitch, gain, length } = layer.sequence[currentStep]
        // Add the zero to create a new variable instead of a reference
        pitch = pitch + 0
        synthMap[uuid][layerIndex].noteOn(pitch, gain)

        setTimeout(() => synthMap[uuid][layerIndex].noteOff(pitch), length)
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

