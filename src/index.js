var EventEmitter = require('events').EventEmitter;
var debug        = require('debug')('app:phperrorlog');

export default class PhpErorLogParser extends EventEmitter {
    /**
     * Constructor
     *
     * @param {int} threshold Log line input interval threshold in milli seconds.
     *   `threshold` stands for multi line parsing.
     *   If a bunch of lines come within `threashold`, the parser can
     *   parse them together.
     */
    constructor(threshold) {
        this.threshold = threshold;
        this.timerId   = null;

        this.oldFasionStackTrace = false;

        this.record = {
            time: null,
            level: null,
            lines: [],
            stacktrace: null
        };
    }

    addLine(line) {
        this.extendTimer();

        var record = this.record;
        var hasTime = false;
        var timeString = null;

        if (line.slice(0, 1) === '[') {
            var match = line.match(/^\[((\d{1,2}-[A-Z][a-z]{2}-\d{4} \d{2}:\d{2}:\d{2})(?: [^\]]+)?)\] /);
            if (match) {
                hasTime = true;
                timeString = match[2];
                line = line.substring(match[0].length);
            }
        }

        if (record.stacktrace) {
            // in stack trace
            if (this.oldFasionStackTrace) {
                if (hasTime) {
                    // it's new log entry.
                    this.flush();
                    this.newRecord(timeString, line);
                } else {
                    record.stacktrace.push(line);
                }
                return;
            } else if (/^PHP\s+\d+\./.test(line)) {
                // e.g.  'PHP   1. {main}() /home/project/...'
                record.stacktrace.push(line);
                return;
            }
        }

        if (!hasTime && line === 'Stack trace:') {
            debug('starting stack trace(old fasion)');
            this.oldFasionStackTrace = true;
            record.lines.push(line);
            record.stacktrace = [];
            return;
        }
        if (line === 'PHP Stack trace:') {
            debug('starting stack trace');
            this.oldFasionStackTrace = false;
            record.lines.push(line);
            record.stacktrace = [];
            return;
        }

        if (line.substring(0, 4) === 'PHP ') {
            // logged by PHP
            this.flush();
            this.newRecord(timeString, line);
        } else {
            // maybe a continuous line
            record.lines.push(line);
        }
    }

    extendTimer() {
        if (this.timerId) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
            this.flush();
            this.timerId = null;
        }, this.threshold);
    }

    newRecord(timeString, line) {
        debug('newRecord', timeString, line);
        this.record.time = new Date(timeString);
        this.record.lines = [line];
        var match = line.match(/PHP ([A-Z].*?)(?: error)?:/);
        this.record.level = match ? match[1] : null;
    }

    flush() {
        debug('flush', record);
        var record = this.record;
        if (record.time && 0 < record.lines.length) {
            this.emit('record', record);
            record.time = null;
            record.lines = [];
            record.stacktrace = null;
        }
    }
}
