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

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/LucianBuzzo/beeperfleet.git
# Go into the repository
cd beeperfleet
# Install dependencies
npm install
```

To start the server app run:  

`$ npm run server`

The server app outputs all the audio for the connected clients, so it
should be connected to a massive set of speakers.

To start the client app run:

`$ npm start`

By default the client app will try to connect to the server at `localhost`. 
To change this behaviour, you can specify the `SERVER_ADDRESS`
environment variable.

`$ SERVER_ADDRESS=http://192.168.0.6:8080 npm start`

If your deploying to a touch enabled device, set the `TOUCH_ENABLED` environment
variable to `1`.

### URL LAUNCHER config via ENV VARS

simply set these [environment varables](http://docs.resin.io/#/pages/management/env-vars.md) in your app via "Environment Variables" panel in the resin dashboard to configure the behaviour of your devices.
*__Please note that the `bool` type definition in the table is meant to accept to either `0` or `1` values.__*

* **`URL_LAUNCHER_URL`** *string* - the URL to be loaded. use `file:////usr/src/app/data/index.html` to load a local electronJS (or any website) app - *defaults to* `file:////usr/src/app/data/index.html`
* **`URL_LAUNCHER_NODE`** *bool* (converted from *string*) - whether or not enable nodejs - *defaults to* `0`
* **`URL_LAUNCHER_KIOSK`** *bool* (converted from *string*) - whether or not enter KIOSK mode - *defaults to* `1`
* **`URL_LAUNCHER_TITLE`** *string* - the title of the window. Seen only with `URL_LAUNCHER_FRAME`=`true` - *defaults to* `RESIN.IO`
* **`URL_LAUNCHER_FRAME`** *bool* (converted from *string*) - set to "true" to display the window frame. Seen only with `URL_LAUNCHER_KIOSK`=`false` - *defaults to*  `0`
* **`URL_LAUNCHER_CONSOLE`** *bool* (converted from *string*) - set to "true" to display the debug console -  *defaults to*  `0`
* **`URL_LAUNCHER_WIDTH`**  *int* (converted from *string*) -  - *defaults to* `1920`
* **`URL_LAUNCHER_HEIGHT`**  *int* (converted from *string*) -  - *defaults to* `1080`
* **`URL_LAUNCHER_TOUCH`** *bool* (converted from *string*) - enables touch events if your device supports them  - *defaults to* `0`
* **`URL_LAUNCHER_TOUCH_SIMULATE`** *bool* (converted from *string*) - simulates touch events - might be useful for touchscreen with partial driver support - be aware this could be a performance hog  - *defaults to* `0`
* **`URL_LAUNCHER_ZOOM`** *float* (converted from *string*) - The default zoom factor of the page, 3.0 represents 300%  - *defaults to* `1.0`
* **`URL_LAUNCHER_OVERLAY_SCROLLBARS`** *bool* (converted from *string*) - enables overlay scrollbars  - *defaults to* `0`

[electron]: http://electron.atom.io/
[react]: https://facebook.github.io/react/
[redux]: http://redux.js.org/
