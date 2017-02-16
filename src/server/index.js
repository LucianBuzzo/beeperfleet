var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', (socket) => {
  console.log('a client connected');
});

http.listen(8080, () => {
  console.log('listening on *:8080');
});
