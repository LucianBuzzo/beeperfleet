const React = require('react')
const _ = require('lodash')

const { socket, store, actions } = require('../services')
const { UPDATE_SYNTH } = actions

class Controls extends React.Component {
  constructor(props) {
    super(props)

    let layers = store.getState().get('layers').toJS()
    let activeLayer = _.find(layers, { active: true })
    if (!activeLayer) {
      activeLayer = layers[0]
    }
    this.state = _.assign({ active: false }, activeLayer.synthOptions)

    store.subscribe(() => {
      let mode = store.getState().get('mode')
      let layers = store.getState().get('layers').toJS()
      let activeLayer = _.find(layers, { active: true })
      if (!activeLayer) {
        activeLayer = layers[0]
      }
      let {
        filterCutoff,
        filterQ,
        filterMod,
        filterEnv,
      } = activeLayer.synthOptions
      this.setState({
        active: mode === 'controls',
        filterCutoff,
        filterQ,
        filterMod,
        filterEnv,
      })
    })

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event, prop) {
    let layers = store.getState().get('layers').toJS()
    let activeLayer = _.findIndex(layers, { active: true })
    if (activeLayer < 0) {
      activeLayer = 0
    }
    let value = parseInt(event.target.value, 10)

    switch (prop) {
      case 'filterCutoff':
        this.setState({ filterCutoff: value })
        break
      case 'filterQ':
        this.setState({ filterQ: value })
        break
      case 'filterMod':
        this.setState({ filterMod: value })
        break
      case 'filterEnv':
        this.setState({ filterEnv: value })
        break
    }
    socket.emit(UPDATE_SYNTH, {
      prop,
      layer: activeLayer,
      value,
    })
    store.dispatch({
      type: UPDATE_SYNTH,
      prop,
      layer: activeLayer,
      value,
    })
  }

  render() {
    return (
      <div className={"controls " + (this.state.active ? 'active' : '')}>
        <div className="controls__section">
          <label>Cutoff</label>
          <input onChange={(e) => this.handleChange(e, 'filterCutoff')} value={this.state.filterCutoff} min="20" max="20000" type="range" />
        </div>
        <div className="controls__section">
          <label>Q</label>
          <input onChange={(e) => this.handleChange(e, 'filterQ')} value={this.state.filterQ} min="0" max="20" type="range" />
        </div>
        <div className="controls__section">
          <label>Mod</label>
          <input onChange={(e) => this.handleChange(e, 'filterMod')} value={this.state.filterMod} min="0" max="100" type="range" />
        </div>
        <div className="controls__section">
          <label>Env</label>
          <input onChange={(e) => this.handleChange(e, 'filterEnv')} value={this.state.filterEnv} min="0" max="100" type="range" />
        </div>
      </div>
    )
  }
}

module.exports = Controls
