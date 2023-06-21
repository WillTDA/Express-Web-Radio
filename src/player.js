const fs = require("fs");
const path = require("path");
const { randomBytes } = require("crypto");
const { PassThrough } = require("stream");
const Throttle = require("throttle");
const { ffprobe } = require("@dropb/ffprobe");

class Player {

    constructor(options = {}) {
        this._options = options;
        this._currentSongStream = null;
        this.sinks = new Map(); // map of active sinks/writables
        this.songs = []; // list of queued up songs
        this.currentSong = null;
        this.playing = false;

        this._options.logFn(`Found ${this.readSongs().length} songs.`);
    }

    readSongs() {
        const audioDirectory = fs.readdirSync(path.join(process.cwd(), this._options.audioDirectory), { withFileTypes: true });
        let songs = audioDirectory.filter((item) => item.isFile && path.extname(item.name) === ".mp3").map((item) => item.name);
        if (this._options.shuffle) {
            for (let i = songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [songs[i], songs[j]] = [songs[j], songs[i]];
            }
        }
        return songs;
    };

    createResponseSink() {
        const id = randomBytes(16).toString("hex");
        this._options.logFn(`New sink created with id ${id}`);
        const responseSink = PassThrough();
        this.sinks.set(id, responseSink);
        return { id, responseSink };
    }

    removeResponseSink(id) {
        const sink = this.sinks.get(id) || null;
        if (sink) sink.destroy();
        this.sinks.delete(id);
        this._options.logFn(`Stream closed for sinkId ${id}`);
    }

    broadcastChunk(chunk) {
        for (const [, sink] of this.sinks) {
            sink.write(chunk);
        }
    }

    async getBitRate(song) {
        try {
            const bitRate = this._options.bitrate || (await ffprobe(song)).streams[0].bit_rate;
            return parseInt(bitRate);
        }
        catch (err) {
            this._options.logFn(`Error occurred while reading bitrate of ${song}, using hardcoded fallback value. (128kbps)`);
            return 128000;
        }
    }

    async playNextSong() {
        if (this.songs.length === 0) {
            if (this._options.loop) {
                this.songs = this.readSongs();
            } else {
                this._options.logFn("No more songs to play.");
                this._currentSongStream.destroy();
                this._currentSongStream = null;
                this.playing = false;
                for (const [, sink] of this.sinks) {
                    sink.end();
                }
                this.sinks.clear();
                this._options.logFn("Radio stream has stopped playing.");
                return;
            }
        }
        this.currentSong = this.songs.shift();

        const songPath = path.join(process.cwd(), this._options.audioDirectory, this.currentSong);
        this._currentSongStream = fs.createReadStream(songPath);
        const bitRate = await this.getBitRate(songPath);
        const songThrottle = new Throttle(bitRate / 8);
        this._options.logFn(`Now Playing: ${this.currentSong} | Bitrate: ${bitRate / 1000}kbps`);
        this.playing = true;

        this._currentSongStream.pipe(songThrottle).on("data", (chunk) => {
            this.broadcastChunk(chunk);
        }).on("end", () => {
            if (!this.playing) {
                this._currentSongStream.destroy();
                this._currentSongStream = null;
                for (const [, sink] of this.sinks) {
                    sink.end();
                }
                this.sinks.clear();
                this._options.logFn("Radio stream has stopped playing.");
                return;
            }
            this.playNextSong();
        });
    }

    start() {
        this.songs = this.readSongs();
        this.playNextSong();
    }

    stop(graceful) {
        this.songs = [];
        this.playing = false;
        if (!graceful) {
            this._currentSongStream.destroy();
            this._currentSongStream = null;
            for (const [, sink] of this.sinks) {
                sink.end();
            }
            this.sinks.clear();
            this._options.logFn("Radio stream has stopped playing.");
            return;
        }
        this._options.logFn("Radio stream will stop playing after the current song.");
    }
}

module.exports = Player;