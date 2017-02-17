const { store } = require('../services')
const React = require('react')

const {
  CHANGE_MODE,
} = require('../services/actions')

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
      value: mode,
    })
  }
  render() {
    return (
      <div className="toolbar toolbar-left">
        <button
          onClick={() => this.setActive('note')}
          className = {'toolbar__button-note ' + (this.state.activeButton === 'note' ? 'active' : '')}>
          <i className="fa fa-music" aria-hidden="true"></i>
        </button>
        <button
          onClick={() => this.setActive('volume')}
          className = {'toolbar__button-volume ' + (this.state.activeButton === 'volume' ? 'active' : '')}>
          <i className="fa fa-volume-up" aria-hidden="true"></i>
        </button>
        <button
          onClick={() => this.setActive('length')}
          className = {'toolbar__button-length ' + (this.state.activeButton === 'length' ? 'active' : '')}>
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

module.exports = ToolbarLeft
