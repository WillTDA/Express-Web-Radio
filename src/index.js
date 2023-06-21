const fs = require("fs");
const path = require("path");
const Player = require("./player");

/**
 * Options for the Web Radio.
 * @typedef {Object} WebRadioOptions
 * @prop {String} [audioDirectory="./audio"] The directory where the audio files are located. Defaults to `"./audio"`.
 * 
 * __Note 1:__ The directory path is relative to the current working directory. (`process.cwd()`)
 * 
 * __Note 2:__ Only MP3 files are supported. Any other file type will be ignored.
 * @prop {Number} [bitrate=undefined] Set a strict bitrate at which audio files should be played.
 * 
 * If unspecified, `@dropb/ffprobe` will be used to dynamically determine the bitrate for each file. __(Recommended)__
 * 
 * __About strict bitrates:__
 * 
 * Setting a strict bitrate should be used as a last resort if you cannot get FFmpeg to work on your system.
 * 
 * If you are setting a strict bitrate, make sure that all the audio files in the `audioDirectory` have the same bitrate. If set incorrectly, the audio files may play at the wrong speed, buffer on the client side, or not play at all.
 * 
 * @prop {Boolean} [loop=true] Decides whether the songs in the `audioDirectory` should be played indefinitely. Defaults to `true`.
 * @prop {Boolean} [shuffle=false] Decides whether the songs in the `audioDirectory` should play in a random order. Defaults to `false`.
 * @prop {Function} [logFn=console.log] The function to use for logging. Defaults to `console.log`.
 */

class WebRadio {
    /**
     * Create a new Express Web Radio.
     * @param {WebRadioOptions} [options={}] The options for the radio.
     * @example
     * const express = require("express");
     * const app = express();
     *
     * const WebRadio = require("express-web-radio");
     * const radio = new WebRadio({
     *     audioDirectory: "./audio",
     *     shuffle: true,
     *     logFn: (msg) => console.log(`[Radio]: ${msg}`)
     * });
     *
     * radio.start(); //start the radio stream
     * 
     * app.get("/stream", radio.connect()); //allow clients to connect to the radio stream
     * 
     * app.listen(3000, () => console.log("Server running on port 3000."));
     */

    constructor(options = {}) {
        this.options = options;

        //write validation for options here
        if (!this.options.audioDirectory) this.options.audioDirectory = "./audio";
        if (this.options.loop === undefined) this.options.loop = true;
        if (this.options.shuffle === undefined) this.options.shuffle = false;
        if (!this.options.logFn) this.options.logFn = console.log;


        //validate options
        if (typeof this.options.audioDirectory !== "string") {
            throw new Error(`Audio directory '${this.options.audioDirectory}' is not a string.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        }

        if (!fs.existsSync(this.options.audioDirectory)) {
            throw new Error(`Audio directory '${path.join(process.cwd(), this.options.audioDirectory)}' does not exist.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        }

        if (this.options.bitrate && typeof this.options.bitrate !== "number") {
            throw new Error(`Bitrate option '${this.options.bitrate}' is not a number.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        }

        if (typeof this.options.loop !== "boolean") {
            throw new Error(`Loop option '${this.options.loop}' is not a boolean.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        }

        if (typeof this.options.shuffle !== "boolean") {
            throw new Error(`Shuffle option '${this.options.shuffle}' is not a boolean.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        }

        if (typeof this.options.logFn !== "function") {
            throw new Error(`Log function '${this.options.logFn}' is not a function.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        }

        //create player instance
        this.player = new Player(this.options);
        if (this.player.readSongs().length === 0) {
            throw new Error(`Audio directory '${path.join(process.cwd(), this.options.audioDirectory)}' contains no MP3 files.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        }
    }

    /**
     * Start the radio stream.
     * @example
     * const WebRadio = require("express-web-radio");
     * const radio = new WebRadio({
     *     audioDirectory: "./audio",
     *     shuffle: true,
     *     logFn: (msg) => console.log(`[Radio]: ${msg}`)
     * });
     * 
     * radio.start(); //start the radio stream
     */

    start() {
        if (this.playing || (this.player._currentSongStream !== null)) throw new Error(`Radio is already playing. If "stop()" was called gracefully, please wait for the current song to finish.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        this.player.start();
    }

    /**
     * Stop the radio stream, and disconnect all connected clients.
     * 
     * Useful for when you want to stop the radio stream after a certain amount of time, or when a certain event occurs.
     * @param {Boolean} [graceful=false] Decides whether to wait for the current song to finish playing before stopping the radio stream. Defaults to `false`.
     * @example
     * const WebRadio = require("express-web-radio");
     * const radio = new WebRadio({
     *     audioDirectory: "./audio",
     *     shuffle: true,
     *     logFn: (msg) => console.log(`[Radio]: ${msg}`)
     * });
     * 
     * radio.start(); //start the radio stream
     * setTimeout(() => radio.stop(), 10000); //stop the radio stream immediately after 10 seconds
     */

    stop(graceful = false) {
        if (!this.player.playing) throw new Error(`Radio is not playing.\nNeed Help? Join our Discord Server at 'https://discord.gg/P2g24jp'`);
        this.player.stop(graceful);
    }

    /**
     * Middleware to connect to the radio stream.
     * 
     * __Note:__ This middleware must be attached to the end of the middleware chain, it does not pass control with `next()`.
     * @returns {Function} The middleware function.
     * @example
     * const WebRadio = require("express-web-radio");
     * const radio = new WebRadio({
     *     audioDirectory: "./audio",
     *     shuffle: true,
     *     logFn: (msg) => console.log(`[Radio]: ${msg}`)
     * });
     * 
     * radio.start(); //start the radio stream
     * 
     * app.get("/stream", radio.connect()); //allow clients to connect to the radio stream
     */

    connect() {
        return (req, res) => {
            if (!this.player.playing && (this.player._currentSongStream === null)) {
                //send error if radio is not playing
                res.status(503).send("Radio is offline."); //503 = service unavailable
                this.options.logFn(`A client attempted to connect to radio stream, but radio is currently offline/not playing.`);
                return;
            }
            const { id, responseSink } = this.player.createResponseSink();
            req.radioSinkId = id;
            res.on("close", () => {
                this.player.removeResponseSink(req.radioSinkId);
            });
            res.writeHead(200, {
                "Content-Type": "audio/mpeg",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Keep-Alive": "timeout=5, max=1000"
            });
            responseSink.on("data", (chunk) => {
                res.write(chunk);
            });
            responseSink.on("end", () => {
                res.end();
            });
        };
    };
}

module.exports = WebRadio;