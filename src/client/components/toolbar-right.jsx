const React = require('react')
const { socket, store } = require('../services')

const { Layer } = require('../models')
const {
  ADD_LAYER,
  TOGGLE_LAYERS,
} = require('../services/actions')

class ToolbarRight extends React.Component {
  constructor(props) {
    super(props)

    this.state = { showLayers: false }

    store.subscribe(() => {
      this.setState({ showLayers: store.getState().get('showLayers') })
    })
  }

  addLayer() {
    let layer = Layer.create(store.getState().get('layers').size + 1)
    store.dispatch({
      type: ADD_LAYER,
      value: layer,
    })
    socket.emit(ADD_LAYER, {
      value: layer,
    })
  }

  toggleLayers() {
    store.dispatch({
      type: TOGGLE_LAYERS,
    })
  }
  render() {
    return (
      <div className="toolbar toolbar-right">
        <button
          className={(this.state.showLayers ? 'active' : '')}
          onClick={this.toggleLayers}>
          <i className="fa fa-server" aria-hidden="true"></i>
        </button>
        {this.state.showLayers &&
          <button onClick={this.addLayer}>
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
        }
      </div>
    )
  }
}

module.exports = ToolbarRight
