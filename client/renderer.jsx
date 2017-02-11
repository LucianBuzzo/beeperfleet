const socket = require('socket.io-client')('http://localhost:8080')
const uuidV4 = require('uuid/v4')
const clientUUID = uuidV4()
const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const redux = require('redux')

const CHANGE_MODE = 'CHANGE_MODE'

const reducer = (state, action) => {
  if (!state) {
    state = Immutable.fromJS({
      mode: 'note'
    })
  }

  switch (action.type) {
    case CHANGE_MODE:
      return state.set('mode', action.value)
    default:
      return state
  }
}

let store = redux.createStore(reducer)

// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16

const sequence = [...Array(SEQUENCE_LENGTH)].map(() => ({
  active: false,
  midiNumber: 60,
  volume: 0.5,
  length: 100
}))

store.subscribe(() => {
  console.log(store.getState().toJS())
})

socket.on('connect', () => {
  console.log('connected')
  socket.emit('sequence', {
    id: clientUUID,
    sequence
  })
})

class Tile extends React.Component {
  componentWillMount() {
    socket.on('heartbeat', (step) => {
      this.setState(() => ({
        highlight: this.props.sequenceNum === step
      }))
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      active: 0,
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
    sequence[this.props.sequenceNum].length = val
    socket.emit('sequenceLengthUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: val
    })
  }

  handleVolumeChange(e) {
    let val = (100 - parseInt(e.target.value, 10)) / 100
    console.log(val)
    this.setState({ volume: val })
    sequence[this.props.sequenceNum].volume = val
    socket.emit('sequenceVolumeUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: val
    })
  }

  handleChange(e) {
    let val = 71 - parseInt(e.target.value, 10)
    console.log(val)
    this.setState({ midiNumber: val })
    sequence[this.props.sequenceNum].midiNumber = val
    socket.emit('sequenceMidiUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: val
    })
  }

  stopIt(e) {
    e.stopPropagation()
  }

  toggle(e) {
    console.log(e)
    let active = !this.state.active
    this.setState(() => ({ active }))
    sequence[this.props.sequenceNum].active = active
    socket.emit('sequenceUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: active
    })
  }
}

class Grid extends React.Component {
  constructor() {
    super()
    this.state = {
      mode: store.getState().get('mode')
    }

    store.subscribe(() => {
      let mode = store.getState().get('mode')
      this.setState({ mode })
    })
  }

  render() {
    const tiles = sequence.map((item, index) =>
      <Tile sequenceNum={index} key={index} />
    )
    return (
      <div className={"grid mode-" + this.state.mode}>{tiles}</div>
    )
  }
}

class Toolbar extends React.Component {
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
      <div className="toolbar">
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
      </div>
    )
  }
}

class Beeper extends React.Component {
  render() {
    return (
      <div className="beeper">
        <Toolbar />
        <Grid />
      </div>
    )
  }
}

ReactDOM.render(
  <Beeper />,
  document.getElementById('root')
)
