const { ipcRenderer, remote } = require('electron')
const main = remote.require('./main.js')

ipcRenderer.on('clientConnect', (event, arg) => {
  console.log(arg)
})
