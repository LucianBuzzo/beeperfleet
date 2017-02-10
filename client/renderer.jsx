const socket = require('socket.io-client')('http://localhost:8080')
const uuidV4 = require('uuid/v4')
const clientUUID = uuidV4()
const React = require('react')
const ReactDOM = require('react-dom')

const SEQUENCE_LENGTH = 16

const sequence = [...Array(SEQUENCE_LENGTH)].map(() => 0)

socket.on('connect', () => {
  console.log('connected')
  socket.emit('clientSequence', {
    id: clientUUID,
    sequence
  })
})

class Tile extends React.Component {
  constructor(props) {
    super(props)
    this.state = { active: 0 }
    this.toggle = this.toggle.bind(this);
  }

  render() {
    return (
      <button onClick={this.toggle} className="tile">
      {this.state.active ? 'ON' : 'OFF'}
      </button>
    )
  }

  toggle() {
    this.setState(prevState => ({
      active: !prevState.active
    }));
  }
}

class Grid extends React.Component {
  renderTile(i) {
    return <Tile />;
  }
  render() {
    const tiles = sequence.map((item, index) =>
      <Tile key={index} />
    )
    return (
      <div className="grid">{tiles}</div>
    );
  }
}

ReactDOM.render(
  <Grid />,
  document.getElementById('root')
)
