<h1 align="center">
  📻 Express Web Radio 📻
</h1>

<center style="margin-bottom:1rem;">A simple, easily configurable web radio implementation for Express.js. Read MP3 files, and stream them on app routes.

**Please Note:** Currently, this package only supports **MP3** files. Support for other audio formats may be added in the future.

**Working Example (using my own music 😅):** [https://radio.diamonddigital.dev/willtda](https://radio.diamonddigital.dev/willtda)
</center>

[![NPM](https://nodei.co/npm/express-web-radio.png)](https://npmjs.com/package/express-web-radio)

[![Downloads](https://img.shields.io/npm/dt/express-web-radio?logo=npm&style=flat-square)](https://npmjs.com/package/express-web-radio) [![Discord Server](https://img.shields.io/discord/667479986214666272?logo=discord&logoColor=white&style=flat-square)](https://diamonddigital.dev/discord)

<a href="https://www.buymeacoffee.com/willtda" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

## Features

- ⚡ <b>Fast and Efficient</b> | Express Web Radio is built for production, and is heavily optimized for speed and memory usage. Express Web Radio keeps track of connected clients and readstreams, and frees up resources when they are no longer needed.

- 🤹‍♂️ <b>Unlimited Stations</b> | Express Web Radio's class-based design allows you to create as many stations as you want, and attach them to different routes in your app without any interference.

- 📦 <b>Easy Integration</b> | Express Web Radio is designed with developers in mind, and provides a super easy API to get started with. Express Web Radio also provides a simple middleware function to serve the radio on a route.

## Install Package

Express Web Radio can be installed with the following command:

```sh
npm install express-web-radio --save
```

## Setup and Usage

To create a radio in your Express application, you must first create a new instance of the `WebRadio` class. This class takes in an optional `options` object as a parameter, which can be used to configure the radio.

```js
const WebRadio = require("express-web-radio");

const radio = new WebRadio({
  // Options go here
});
```

The following options are available:

- `audioDirectory` - (**string**)
    - The directory where your audio files are stored. Defaults to `"./audio"`.

    - **Note:** The directory path is relative to the current working directory of your application. (`process.cwd()`)

- `bitrate` - (**number**)
    - Set a strict bitrate at which audio files should be played. If unspecified, `@dropb/ffprobe` will be used to dynamically determine the bitrate for each file. If an error occurs while using `@dropb/ffprobe`, the bitrate will fallback to `128000` (128kbps).
    
    - **Note:** `@dropb/ffprobe` requires `ffmpeg` to be installed on your system to function properly. This option should only be used as a last resort if you cannot get `ffmpeg` installed and working correctly.

- `loop` - (**boolean**)
    - Decides whether the songs in the `audioDirectory` should be played indefinitely. Defaults to `true`.

- `shuffle` - (**boolean**)
    - Decides whether the songs in the `audioDirectory` should play in a random order. Defaults to `false`.

- `logFn` - (**function**)
    - A function that will be called whenever the radio logs something. Defaults to `console.log`.

    - **Example:** `logFn: (msg) => console.log(msg)`

## Starting the Radio

Once you have created a radio instance, you can start the radio by calling the `start()` method.

```js
const WebRadio = require("express-web-radio");

const radio = new WebRadio({
  // Options go here
});

radio.start(); // Start the radio
```

## Allowing Connections to the Radio

To allow clients to connect to the radio, you must first create a route in your Express application. Then, you can use the `connect()` method to create a middleware function that will allow clients to connect to the radio stream.

**Note:** You may notice a considerable delay between the time you request the route and the time the audio starts playing. This is because throttling is used to ensure smooth playback across all connected clients.
```js
//assuming you have already created an Express app and a radio instance...

app.get("/stream", radio.connect()); //allow clients to connect to the radio stream
```

## Stopping the Radio

To stop the radio stream and disconnect all connected clients, you can call the `stop()` method.

This method also has an optional `graceful` parameter, which can be used to decide whether the radio should wait for the current song to finish playing before stopping. This parameter defaults to `false`.

```js
//assuming you have already created an Express app and a radio instance that is running...

//stop the radio stream immediately
radio.stop();

//stop the radio stream gracefully (wait for the current song to finish playing)
radio.stop(true);
```

## Full Example

Here's a full example of how you can use Express Web Radio in your application:

```js
const express = require("express");
const app = express();

const WebRadio = require("express-web-radio");

const radio = new WebRadio({
    audioDirectory: "./audio", //set the directory where audio files are stored
    loop: true, //loop the audio files
    shuffle: true, //shuffle the play order of the audio files
    logFn: (msg) => console.log(`[Radio]: ${msg}`) //log radio messages to the console
});

radio.start(); //start the radio stream

app.get("/stream", radio.connect()); //allow clients to connect to the radio stream

app.listen(3000, () => console.log("Server running on port 3000!"));
```

## Contact Us

- 👋 Need help? [Join our Discord Server](https://diamonddigital.dev/discord)!
- 👾 Found a bug? [Open an issue](https://github.com/WillTDA/Express-Web-Radio/issues),
  or fork and [submit a pull request](https://github.com/WillTDA/Express-Web-Radio/pulls)
  on our [GitHub repository](https://github.com/WillTDA/Express-Web-Radio)!
<hr>
<center>
<a href="https://diamonddigital.dev/"><strong>Created and maintained by</strong>
<img align="center" style="width:25%;height:auto" src="https://diamonddigital.dev/img/png/ddd_logo_text_transparent.png" alt="Diamond Digital Development Logo"></a>
</center>