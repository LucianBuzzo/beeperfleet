const socket = require('socket.io-client')('http://localhost:8080')
const uuidV4 = require('uuid/v4')
const clientUUID = uuidV4()
const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const redux = require('redux')

// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16

const CHANGE_MODE = 'CHANGE_MODE'
const ADD_LAYER = 'ADD_LAYER'
const ACTIVATE_LAYER = 'ACTIVATE_LAYER'
const TOGGLE_LAYERS = 'TOGGLE_LAYERS'
const SEQ_ACTIVE_UPDATE = 'SEQ_ACTIVE_UPDATE'
const SEQ_VOLUME_UPDATE = 'SEQ_VOLUME_UPDATE'
const SEQ_LENGTH_UPDATE = 'SEQ_LENGTH_UPDATE'
const SEQ_PITCH_UPDATE = 'SEQ_PITCH_UPDATE'

const createSequence = () => [...Array(SEQUENCE_LENGTH)].map(() => ({
  active: false,
  midiNumber: 60,
  volume: 0.5,
  length: 100
}))

const createLayer = (nameNumber = 1) => ({
  name: 'Layer ' + nameNumber,
  active: false,
  sequence: createSequence(),
  synthOptions: {}
})


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
      return state.setIn(['layers', action.layer, 'sequence', action.tile, 'midiNumber'], action.value)
    case SEQ_VOLUME_UPDATE:
      return state.setIn(['layers', action.layer, 'sequence', action.tile, 'volume'], action.value)
    default:
      return state
  }
}

let store = redux.createStore(reducer)

socket.on('connect', () => {
  console.log('connected')
  socket.emit('initialise', {
    id: clientUUID,
    layers: store.getState().toJS().layers
  })
})

class Tile extends React.Component {
  componentWillMount() {
    socket.on('heartbeat', (step) => {
      this.setState({
        highlight: this.props.sequenceNum === step
      })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      active: false,
      highlight: false,
      midiNumber: 60,
      volume: 0.5,
      length: 100
    }
    this.toggle = this.toggle.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleVolumeChange = this.handleVolumeChange.bind(this)
    this.handleLengthChange = this.handleLengthChange.bind(this)

  }

  render() {
    return (
      <button onClick={this.toggle}
        className={"tile " + (this.state.highlight ? 'highlight' : '') + ' ' + (this.state.active ? 'active' : '')}>
        <input
          onClick={this.stopIt}
          onChange={this.handleChange}
          className="control-slider slider-note"
          type="range"
          value={71 - this.state.midiNumber}
          min="0"
          max="23" />
        <input
          onClick={this.stopIt}
          onChange={this.handleVolumeChange}
          className="control-slider slider-volume"
          type="range"
          value={100 - this.state.volume * 100}
          min="0"
          max="100" />
        <input
          onClick={this.stopIt}
          onChange={this.handleLengthChange}
          className="control-slider slider-length"
          type="range"
          min="0"
          max="1000" />
      </button>
    )
  }

  handleLengthChange(e) {
    let val = parseInt(e.target.value, 10)
    this.setState({ length: val })
    store.dispatch({
      type: SEQ_LENGTH_UPDATE,
      layer: this.props.layer,
      tile: this.props.sequenceNum,
      value: val
    })
    socket.emit('sequenceLengthUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: val
    })
  }

  handleVolumeChange(e) {
    let val = (100 - parseInt(e.target.value, 10)) / 100
    this.setState({ volume: val })
    store.dispatch({
      type: SEQ_VOLUME_UPDATE,
      layer: this.props.layer,
      tile: this.props.sequenceNum,
      value: val
    })
    socket.emit('sequenceVolumeUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: val
    })
  }

  handleChange(e) {
    let val = 71 - parseInt(e.target.value, 10)
    this.setState({ midiNumber: val })
    store.dispatch({
      type: SEQ_PITCH_UPDATE,
      layer: this.props.layer,
      tile: this.props.sequenceNum,
      value: val
    })
    socket.emit('sequenceMidiUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: val
    })
  }

  stopIt(e) {
    e.stopPropagation()
  }

  toggle() {
    let active = !this.state.active
    this.setState(() => ({ active }))
    store.dispatch({
      type: SEQ_ACTIVE_UPDATE,
      layer: this.props.layer,
      tile: this.props.sequenceNum,
      value: active
    })
    socket.emit('sequenceUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: active
    })
  }
}

class Layer extends React.Component {
  constructor(props) {
    super(props)
    this.state = { active: false }
    this.selectLayer = this.selectLayer.bind(this)

    store.subscribe(() => {
      let active = store.getState().getIn(['layers', this.props.layerNumber, 'active'])
      this.setState({ active })
    })
  }

  selectLayer() {
    console.log('SELECT LAYER')
    store.dispatch({
      type: ACTIVATE_LAYER,
      value: this.props.layerNumber
    })
    store.dispatch({
      type: CHANGE_MODE,
      value: 'note'
    })
  }

  render() {
    const tiles = this.props.layer.sequence.map((item, index) =>
      <Tile sequenceNum={index} key={index} layer={this.props.layerNumber} />
    )
    return (
      <div style={{top: this.props.layerNumber * 100, zIndex: 999 - this.props.layerNumber}}
        className={"layer clearfix " + (this.state.active ? 'active' : '')}>
        <div onClick={this.selectLayer} className="layer__mask"></div>
        {tiles}
      </div>
    )
  }
}

class Grid extends React.Component {
  constructor() {
    super()
    this.state = {
      mode: store.getState().get('mode'),
      layers: store.getState().get('layers').toJS(),
      showLayers: store.getState().get('showLayers')
    }

    store.subscribe(() => {
      let mode = store.getState().get('mode')
      let layers = store.getState().get('layers').toJS()
      let showLayers = store.getState().get('showLayers')
      console.log(layers)
      this.setState({ mode, layers, showLayers })
      this.forceUpdate()
    })
  }

  render() {
    const contents = this.state.layers.map((layer, index) =>
      <Layer layer={layer} layerNumber={index} key={index} />
    )
    return (
      <div className={"grid mode-" + this.state.mode + ' ' + (this.state.showLayers ? 'mode-layers' : 'flat')}
        style={{top: 0 - (this.state.layers.length - 1) * 50}}>{contents}</div>
    )
  }
}

class ToolbarLeft extends React.Component {
  constructor(props) {
    super(props)
    this.state = { activeButton: 'note' }
    this.setActive = this.setActive.bind(this)
  }
  setActive(mode) {
    if (mode === this.state.activeButton) {
      return
    }
    this.setState({ activeButton: mode })
    store.dispatch({
      type: CHANGE_MODE,
      value: mode
    })
  }
  addLayer() {
    store.dispatch({
      type: ADD_LAYER,
      value: createLayer(store.getState().get('layers').size + 1)
    })
  }
  render() {
    return (
      <div className="toolbar toolbar-left">
        <button
          onClick={() => this.setActive('note')}
          className = {(this.state.activeButton === 'note' ? 'active' : '')}>
          <i className="fa fa-music" aria-hidden="true"></i>
        </button>
        <button
          onClick={() => this.setActive('volume')}
          className = {(this.state.activeButton === 'volume' ? 'active' : '')}>
          <i className="fa fa-volume-up" aria-hidden="true"></i>
        </button>
        <button
          onClick={() => this.setActive('length')}
          className = {(this.state.activeButton === 'length' ? 'active' : '')}>
          <i className="fa fa-arrows-h" aria-hidden="true"></i>
        </button>
        <button
          onClick={() => this.setActive('controls')}
          className = {(this.state.activeButton === 'controls' ? 'active' : '')}>
          <i className="fa fa-sliders" aria-hidden="true"></i>
        </button>
        <button
          onClick={() => this.setActive('layers')}
          className = {(this.state.activeButton === 'layers' ? 'active' : '')}>
          <i className="fa fa-server" aria-hidden="true"></i>
        </button>
        <button onClick={this.addLayer}>
          <i className="fa fa-plus" aria-hidden="true"></i>
        </button>
      </div>
    )
  }
}

class ToolbarRight extends React.Component {
  constructor(props) {
    super(props)
  }

  addLayer() {
    console.log('add layer')
    store.dispatch({
      type: ADD_LAYER,
      value: createLayer(store.getState().get('layers').size + 1)
    })
  }

  toggleLayers() {
    store.dispatch({
      type: TOGGLE_LAYERS
    })
  }
  render() {
    return (
      <div className="toolbar toolbar-right">
        <button
          onClick={this.toggleLayers}>
          <i className="fa fa-server" aria-hidden="true"></i>
        </button>
        <button onClick={this.addLayer}>
          <i className="fa fa-plus" aria-hidden="true"></i>
        </button>
      </div>
    )
  }
}

class Controls extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      active: false,
      filterCutoff: 256,
      filterQ: 7,
      filterMod: 21,
      filterEnv: 56
    }

    store.subscribe(() => {
      let mode = store.getState().get('mode')
      this.setState({ active: mode === 'controls' })
    })

    this.handleFilterCutoffChange = this.handleFilterCutoffChange.bind(this)
    this.handleFilterQChange = this.handleFilterQChange.bind(this)
    this.handleFilterModChange = this.handleFilterModChange.bind(this)
    this.handleFilterEnvChange = this.handleFilterEnvChange.bind(this)
  }

  handleFilterCutoffChange(event) {
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterCutoffUpdate', {
      id: clientUUID,
      value,
    })
    this.setState({ filterCutoff: value })
  }

  handleFilterQChange(event) {
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterQUpdate', {
      id: clientUUID,
      value,
    })
    this.setState({ filterQ: value })
  }
  handleFilterModChange(event) {
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterModUpdate', {
      id: clientUUID,
      value,
    })
    this.setState({ filterMod: value })
  }
  handleFilterEnvChange(event) {
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterEnvUpdate', {
      id: clientUUID,
      value,
    })
    this.setState({ filterEnv: value })
  }

  render() {
    return (
      <div className={"controls " + (this.state.active ? 'active' : '')}>
        <h2>Filter</h2>
        <div>
          Cutoff
          <br />
          <input onChange={this.handleFilterCutoffChange} value={this.state.filterCutoff} min="20" max="20000" type="range" />
        </div>
        <div>
          Q
          <br />
          <input onChange={this.handleFilterQChange} value={this.state.filterQ} min="0" max="20" type="range" />
        </div>
        <div>
          Mod
          <br />
          <input onChange={this.handleFilterModChange} value={this.state.filterMod} min="0" max="100" type="range" />
        </div>
        <div>
          Env
          <br />
          <input onChange={this.handleFilterEnvChange} value={this.state.filterEnv} min="0" max="100" type="range" />
        </div>
      </div>
    )
  }
}

class Beeper extends React.Component {
  render() {
    return (
      <div className="beeper">
        <ToolbarLeft />
        <ToolbarRight />
        <Grid />
        <Controls />
      </div>
    )
  }
}

ReactDOM.render(
  <Beeper />,
  document.getElementById('root')
)
