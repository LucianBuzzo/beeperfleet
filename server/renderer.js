const { ipcRenderer, remote } = require('electron')
const main = remote.require('./main.js')
const Immutable = require('immutable')
const redux = require('redux')

ipcRenderer.on('clientConnect', (event, arg) => {
  console.log(arg)
})

const reducer = (state, action) => {
  if (!state) {
    state = Immutable.fromJS({
      sequences: []
    })
  }

  return state
}

let store = redux.createStore(reducer)
