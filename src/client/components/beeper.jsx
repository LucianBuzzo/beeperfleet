const React = require('react')

const {
  Controls,
  Grid,
  ToolbarLeft,
  ToolbarRight,
} = require('./index')

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
