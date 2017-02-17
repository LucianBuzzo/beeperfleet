const React = require('react')
const { store } = require('../services')

const Tile = require('./tile')

const {
  ACTIVATE_LAYER,
  CHANGE_MODE,
} = require('../services/actions')

class Layer extends React.Component {
  constructor(props) {
    super(props)
    this.state = { active: false }
    this.selectLayer = this.selectLayer.bind(this)

    store.subscribe(() => {
      let active = store.getState().getIn(['layers', this.props.layerNumber, 'active'])
      this.setState({ active })
    })
  }

  selectLayer() {
    console.log('SELECT LAYER')
    store.dispatch({
      type: ACTIVATE_LAYER,
      value: this.props.layerNumber,
    })
    store.dispatch({
      type: CHANGE_MODE,
      value: 'note',
    })
  }

  render() {
    const tiles = this.props.layer.sequence.map((item, index) =>
      <Tile sequenceNum={index} key={index} layer={this.props.layerNumber} />
    )
    return (
      <div style={{top: this.props.layerNumber * 100, zIndex: 999 - this.props.layerNumber}}
        className={"layer clearfix " + (this.state.active ? 'active' : '')}>
        <div onClick={this.selectLayer} className="layer__mask"></div>
        {tiles}
      </div>
    )
  }
}

module.exports = Layer
