## BeeperFleet

A realtime, cooperative music sequencer using [Electron][electron], [React][react] and [Redux][redux].

Client apps running electron will connect to a single server instance via websockets.
Music is created using a 4 X 4 grid (a sequence), tapping a grid tile will let you
set the sound on that tile.
When the client updates their sequence it will also update the sequence
on the server. The server will play all sequences from the clients simultaneously
by iterating over the sequences 1 tile at a time and playing the sound
set to that tile.

### Usage

To start the server app run:  

`$ npm run server`

The server app outputs all the audio for the connected clients, so it
should be connected to a massive set of speakers/

To start the client app run:

`$ npm start`

By default the client app will try to connect to the server at `localhost`. 
To change this behaviour, you can specify the `SERVER_ADDRESS`
environment variable.

`$ SERVER_ADDRESS=http://192.168.0.6:8080 npm start`




[electron]: http://electron.atom.io/
[react]: https://facebook.github.io/react/
[redux]: http://redux.js.org/
