const React = require('react')
const { store } = require('../services')
const Layer = require('./layer')

class Grid extends React.Component {
  constructor() {
    super()
    this.state = {
      mode: store.getState().get('mode'),
      layers: store.getState().get('layers').toJS(),
      showLayers: store.getState().get('showLayers'),
    }

    store.subscribe(() => {
      let mode = store.getState().get('mode')
      let layers = store.getState().get('layers').toJS()
      let showLayers = store.getState().get('showLayers')
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

module.exports = Grid
