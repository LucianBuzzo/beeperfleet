const redux = require('redux')
const Immutable = require('immutable')

const { Layer } = require('../models')

const {
  UPDATE_SYNTH,
  CHANGE_MODE,
  ADD_LAYER,
  ACTIVATE_LAYER,
  TOGGLE_LAYERS,
  SEQ_ACTIVE_UPDATE,
  SEQ_GAIN_UPDATE,
  SEQ_LENGTH_UPDATE,
  SEQ_PITCH_UPDATE,
} = require('./actions')


const reducer = (state, action) => {
  if (!state) {
    state = Immutable.fromJS({
      mode: 'note',
      layers: [Layer.create()],
      showLayers: false,
    })
  }

  switch (action.type) {
    case CHANGE_MODE:
      return state.set('mode', action.value)
    case ADD_LAYER:
      return state.updateIn(['layers'], layers => layers.push(Immutable.fromJS(action.value)))
    case TOGGLE_LAYERS:
      return state.set('showLayers', !state.get('showLayers'))
    case ACTIVATE_LAYER:
      return state.updateIn(['layers'], layers => layers.map((layer, index) => {
        return index === action.value ?
          layer.set('active', true) :
          layer.set('active', false)
      })).set('showLayers', !state.get('showLayers'))
    case SEQ_ACTIVE_UPDATE:
      return state.setIn(['layers', action.layer, 'sequence', action.tile, 'active'], action.value)
    case SEQ_LENGTH_UPDATE:
      return state.setIn(['layers', action.layer, 'sequence', action.tile, 'length'], action.value)
    case SEQ_PITCH_UPDATE:
      return state.setIn(['layers', action.layer, 'sequence', action.tile, 'pitch'], action.value)
    case SEQ_GAIN_UPDATE:
      return state.setIn(['layers', action.layer, 'sequence', action.tile, 'gain'], action.value)
    case UPDATE_SYNTH:
      return state.setIn(['layers', action.layer, 'synthOptions', action.prop], action.value)
    default:
      return state
  }
}

module.exports = redux.createStore(reducer)

