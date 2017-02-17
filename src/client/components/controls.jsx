const React = require('react')
const _ = require('lodash')

const { socket, store } = require('./services')

class Controls extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      active: false,
      filterCutoff: 256,
      filterQ: 7,
      filterMod: 21,
      filterEnv: 56,
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

module.exports = Controls
