const React = require('react')

const { socket, store } = require('../services')

const {
  UPDATE_SEQUENCE,
  SEQ_ACTIVE_UPDATE,
  SEQ_GAIN_UPDATE,
  SEQ_LENGTH_UPDATE,
  SEQ_PITCH_UPDATE,
} = require('../services/actions')

const dragIcon = document.createElement('img')
dragIcon.src = './assets/blank.png'
dragIcon.width = 0
dragIcon.height = 0

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
      mode: 'pitch',
      lastPos: {},
      active: false,
      highlight: false,
      pitch: 60,
      gain: 0.5,
      length: 100,
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleDrag = this.handleDrag.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)

    store.subscribe(() => {
      let mode = store.getState().get('mode')
      this.setState({ mode })
    })
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

  handleDrag(e) {
    const event = e.nativeEvent
    if (!this.state.active) {
      return
    }
    // check to make sure there is data to compare against
    if (typeof this.state.lastPos.x !== 'undefined') {

        // get the change from last position to this position
        let deltaX = this.state.lastPos.x - event.clientX
        let deltaY = this.state.lastPos.y - event.clientY
        let update = false

        // check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
            // left
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
            // right
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
            // up
            update = true
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
            // down
            update = true
        }

        if (update) {
          let slider = e.target.querySelector('.slider-' + this.state.mode)
          let val = parseInt(slider.value, 10)
          let ratio = (slider.max - slider.min) / 100
          slider.value = val - deltaY * ratio * 2
          this.handleChange({ target: slider }, slider.dataset.prop)
        }
    }

    // set the new last position to the current for next time
    this.setState({
      lastPos: {
        x: event.clientX,
        y: event.clientY,
      },
    })
  }

  handleDragStart(e) {
    e.nativeEvent.dataTransfer.effectAllowed = 'move'
    e.nativeEvent.dataTransfer.setDragImage(dragIcon, 0, 0)
  }

  handleDragEnd() {
    this.setState({ lastPost: {} })
  }

  render() {
    return (
      <button
        draggable="true"
        onDrag={this.handleDrag}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onTouchStart={(e) => this.handleChange(e, 'active')}
        onClick={(e) => this.handleChange(e, 'active')}
        className={"tile " + (this.state.highlight ? 'highlight' : '') + ' ' + (this.state.active ? 'active' : '')}>
        <input
          onClick={this.stopIt}
          onChange={(e) => this.handleChange(e, 'pitch')}
          data-prop='pitch'
          className="control-slider slider-note"
          type="range"
          value={71 - this.state.pitch}
          min="0"
          max="23" />
        <input
          onClick={this.stopIt}
          onChange={(e) => this.handleChange(e, 'gain')}
          data-prop='gain'
          className="control-slider slider-volume"
          type="range"
          value={100 - this.state.gain * 100}
          min="0"
          max="100" />
        <input
          onClick={this.stopIt}
          onChange={(e) => this.handleChange(e, 'length')}
          data-prop='length'
          className="control-slider slider-length"
          type="range"
          min="0"
          max="1000" />
      </button>
    )
  }

}

module.exports = Tile
