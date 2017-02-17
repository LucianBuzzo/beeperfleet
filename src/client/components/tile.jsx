const React = require('react')

const { socket, store } = require('./services')

const {
  UPDATE_SEQUENCE,
  SEQ_ACTIVE_UPDATE,
  SEQ_GAIN_UPDATE,
  SEQ_LENGTH_UPDATE,
  SEQ_PITCH_UPDATE,
} = require('../services/actions')

class Tile extends React.Component {
  componentWillMount() {
    socket.on('heartbeat', (step) => {
      this.setState({
        highlight: this.props.sequenceNum === step,
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
      length: 100,
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
      value,
    })
    socket.emit(UPDATE_SEQUENCE, {
      layer: this.props.layer,
      tile: this.props.sequenceNum,
      prop,
      value,
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

module.exports = Tile
