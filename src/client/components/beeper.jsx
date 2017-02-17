const React = require('react')

const Controls = require('./controls')
const Grid = require('./grid')
const ToolbarLeft = require('./toolbar-left')
const ToolbarRight = require('./toolbar-right')

class Beeper extends React.Component {
  render() {
    return (
      <div className="beeper">
        <ToolbarLeft />
        <ToolbarRight />
        <Grid />
        <Controls />
      </div>
    )
  }
}

module.exports = Beeper
