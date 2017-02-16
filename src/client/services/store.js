const redux = require('redux')
const Immutable = require('immutable')

const actions = require('./actions')

const UPDATE_SEQUENCE   = actions.UPDATE_SEQUENCE
const CHANGE_MODE       = actions.CHANGE_MODE
const ADD_LAYER         = actions.ADD_LAYER
const ACTIVATE_LAYER    = actions.ACTIVATE_LAYER
const TOGGLE_LAYERS     = actions.TOGGLE_LAYERS
const SEQ_ACTIVE_UPDATE = actions.SEQ_ACTIVE_UPDATE
const SEQ_GAIN_UPDATE   = actions.SEQ_GAIN_UPDATE
const SEQ_LENGTH_UPDATE = actions.SEQ_LENGTH_UPDATE
const SEQ_PITCH_UPDATE  = actions.SEQ_PITCH_UPDATE


const reducer = (state, action) => {
  if (!state) {
    state = Immutable.fromJS({
      mode: 'note',
      layers: [createLayer()],
      showLayers: false
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
    default:
      return state
  }
}

module.exports = redux.createStore(reducer)

