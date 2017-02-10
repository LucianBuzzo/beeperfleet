const socket = require('socket.io-client')('http://localhost:8080')
const uuidV4 = require('uuid/v4')
const clientUUID = uuidV4()
const React = require('react')
const ReactDOM = require('react-dom')

// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16

const sequence = [...Array(SEQUENCE_LENGTH)].map(() => 0)

socket.on('connect', () => {
  console.log('connected')
  socket.emit('sequence', {
    id: clientUUID,
    sequence
  })
})

socket.on('heartbeat', (step) => {
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
      highlight: false
    }
    this.toggle = this.toggle.bind(this)

  }

  render() {
    return (
      <button onClick={this.toggle} className={"tile " + (this.state.highlight ? 'highlight' : '')}>
      {this.state.active ? 'ON' : ''}
      </button>
    )
  }

  toggle() {
    let active = this.state.active ? 0 : 1
    this.setState(() => ({ active }))
    console.log(active)
    console.log(this.props.sequenceNum)
    sequence[this.props.sequenceNum] = active
    socket.emit('sequenceUpdate', {
      id: clientUUID,
      tile: this.props.sequenceNum,
      value: active
    })
  }
}

class Grid extends React.Component {
  renderTile(i) {
    return <Tile />
  }
  render() {
    const tiles = sequence.map((item, index) =>
      <Tile sequenceNum={index} key={index} />
    )
    return (
      <div className="grid">{tiles}</div>
    )
  }
}

ReactDOM.render(
  <Grid />,
  document.getElementById('root')
)
