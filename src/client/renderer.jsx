const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'http://localhost:8080'
const socket = require('socket.io-client')(SERVER_ADDRESS)
const uuidV4 = require('uuid/v4')
const clientUUID = uuidV4()
const React = require('react')
const ReactDOM = require('react-dom')
const _ = require('lodash')

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

// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16


const createSequence = () => [...Array(SEQUENCE_LENGTH)].map(() => ({
  active: false,
  pitch: 60,
  gain: 0.5,
  length: 100
}))

const createLayer = (nameNumber = 1) => ({
  name: 'Layer ' + nameNumber,
  active: false,
  sequence: createSequence(),
  synthOptions: {
    filterCutoff: 256,
    filterQ: 7,
    filterMod: 21,
    filterEnv: 56
  }
})


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
      pitch: 60,
      gain: 0.5,
      length: 100
    }

    this.handleChange = this.handleChange.bind(this)
  }

  stopIt(e) {
    e.stopPropagation()
  }

  handleChange(e, prop) {
    let value
    let type
    switch (prop) {
      case 'active':
        value = !this.state.active
        this.setState(() => ({ active: value}))
        type = SEQ_ACTIVE_UPDATE
        break
      case 'pitch':
        value = 71 - parseInt(e.target.value, 10)
        this.setState({ pitch: value})
        type = SEQ_PITCH_UPDATE
        break
      case 'gain':
        value = (100 - parseInt(e.target.value, 10)) / 100
        this.setState({ gain: value})
        type = SEQ_GAIN_UPDATE
        break
      case 'length':
        value = parseInt(e.target.value, 10)
        this.setState({ length: value })
        type = SEQ_LENGTH_UPDATE
        break
    }

    store.dispatch({
      type: type,
      layer: this.props.layer,
      tile: this.props.sequenceNum,
      value
    })
    socket.emit(UPDATE_SEQUENCE, {
      id: clientUUID,
      layer: this.props.layer,
      tile: this.props.sequenceNum,
      prop,
      value
    })
  }

  render() {
    return (
      <button onClick={(e) => this.handleChange(e, 'active')}
        className={"tile " + (this.state.highlight ? 'highlight' : '') + ' ' + (this.state.active ? 'active' : '')}>
        <input
          onClick={this.stopIt}
          onChange={(e) => this.handleChange(e, 'pitch')}
          className="control-slider slider-note"
          type="range"
          value={71 - this.state.pitch}
          min="0"
          max="23" />
        <input
          onClick={this.stopIt}
          onChange={(e) => this.handleChange(e, 'gain')}
          className="control-slider slider-volume"
          type="range"
          value={100 - this.state.gain * 100}
          min="0"
          max="100" />
        <input
          onClick={this.stopIt}
          onChange={(e) => this.handleChange(e, 'length')}
          className="control-slider slider-length"
          type="range"
          min="0"
          max="1000" />
      </button>
    )
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
    let layer = createLayer(store.getState().get('layers').size + 1)
    store.dispatch({
      type: ADD_LAYER,
      value: layer
    })
    socket.emit(ADD_LAYER, {
      id: clientUUID,
      value: layer
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
      let layers = store.getState().get('layers').toJS()
      let activeLayer = _.find(layers, { active: true })
      if (!activeLayer) {
        activeLayer = layers[0]
      }
      console.log('ACTIVELAYER', activeLayer)
      let {
        filterCutoff,
        filterQ,
        filterMod,
        filterEnv
      } = activeLayer.synthOptions
      this.setState({
        active: mode === 'controls',
        filterCutoff,
        filterQ,
        filterMod,
        filterEnv
      })
    })

    this.handleFilterCutoffChange = this.handleFilterCutoffChange.bind(this)
    this.handleFilterQChange = this.handleFilterQChange.bind(this)
    this.handleFilterModChange = this.handleFilterModChange.bind(this)
    this.handleFilterEnvChange = this.handleFilterEnvChange.bind(this)
  }

  handleFilterCutoffChange(event) {
    let layers = store.getState().get('layers').toJS()
    let activeLayer = _.findIndex(layers, { active: true })
    if (activeLayer < 0) {
      activeLayer = 0
    }
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterCutoffUpdate', {
      id: clientUUID,
      layer: activeLayer,
      value,
    })
    this.setState({ filterCutoff: value })
  }

  handleFilterQChange(event) {
    let layers = store.getState().get('layers').toJS()
    let activeLayer = _.findIndex(layers, { active: true })
    if (activeLayer < 0) {
      activeLayer = 0
    }
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterQUpdate', {
      id: clientUUID,
      layer: activeLayer,
      value,
    })
    this.setState({ filterQ: value })
  }
  handleFilterModChange(event) {
    let layers = store.getState().get('layers').toJS()
    let activeLayer = _.findIndex(layers, { active: true })
    if (activeLayer < 0) {
      activeLayer = 0
    }
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterModUpdate', {
      id: clientUUID,
      layer: activeLayer,
      value,
    })
    this.setState({ filterMod: value })
  }
  handleFilterEnvChange(event) {
    let layers = store.getState().get('layers').toJS()
    let activeLayer = _.findIndex(layers, { active: true })
    if (activeLayer < 0) {
      activeLayer = 0
    }
    let value = parseInt(event.target.value, 10)
    socket.emit('synthFilterEnvUpdate', {
      id: clientUUID,
      layer: activeLayer,
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
