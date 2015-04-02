"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var EventEmitter = require("events").EventEmitter;
var debug = require("debug")("app:phperrorlog");

var PhpErorLogParser = (function (_EventEmitter) {
    /**
     * Constructor
     *
     * @param {int} threshold Log line input interval threshold in milli seconds.
     *   `threshold` stands for multi line parsing.
     *   If a bunch of lines come within `threashold`, the parser can
     *   parse them together.
     */

    function PhpErorLogParser(threshold) {
        _classCallCheck(this, PhpErorLogParser);

        this.threshold = threshold;
        this.timerId = null;

        this.oldFasionStackTrace = false;

        this.record = {
            time: null,
            level: null,
            lines: [],
            stacktrace: null
        };
    }

    _inherits(PhpErorLogParser, _EventEmitter);

    _createClass(PhpErorLogParser, {
        addLine: {
            value: function addLine(line) {
                this.extendTimer();

                var record = this.record;
                var hasTime = false;
                var timeString = null;

                if (line.slice(0, 1) === "[") {
                    var match = line.match(/^\[((\d{1,2}-[A-Z][a-z]{2}-\d{4} \d{2}:\d{2}:\d{2})(?: [^\]]+)?)\] /);
                    if (match) {
                        hasTime = true;
                        timeString = match[2];
                        line = line.substring(match[0].length);
                    }
                }

                if (record.stacktrace) {
                    // omit empty line
                    if (!hasTime && line === "") {
                        return;
                    }

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

                if (!hasTime && (line === "Stack trace:" || line === "Call Stack:")) {
                    debug("starting stack trace(old fasion)");
                    this.oldFasionStackTrace = true;
                    record.stacktraceHeader = line;
                    record.stacktrace = [];
                    return;
                }
                if (line === "PHP Stack trace:") {
                    debug("starting stack trace");
                    this.oldFasionStackTrace = false;
                    record.stacktraceHeader = line;
                    record.stacktrace = [];
                    return;
                }

                if (line.substring(0, 4) === "PHP ") {
                    // logged by PHP
                    this.flush();
                    this.newRecord(timeString, line);
                } else {
                    // maybe a continuous line
                    record.lines.push(line);
                }
            }
        },
        extendTimer: {
            value: function extendTimer() {
                var _this = this;

                if (this.timerId) clearTimeout(this.timerId);
                this.timerId = setTimeout(function () {
                    _this.flush();
                    _this.timerId = null;
                }, this.threshold);
            }
        },
        newRecord: {
            value: function newRecord(timeString, line) {
                debug("newRecord", timeString, line);
                this.record.time = new Date(timeString);
                this.record.lines = [line];
                var match = line.match(/PHP ([A-Z].*?)(?: error)?:/);
                this.record.level = match ? match[1].toLowerCase() : null;
            }
        },
        flush: {
            value: function flush() {
                debug("flush", record);
                var record = this.record;
                if (record.time && 0 < record.lines.length) {
                    this.normalize(record);
                    this.emit("record", record);
                    record.time = null;
                    record.lines = [];
                    record.stacktrace = null;
                }
            }
        },
        normalize: {
            value: function normalize(record) {
                if (record.stacktrace) {
                    // remove empty string from tail of lines
                    var lines = record.lines;
                    for (var i = lines.length - 1; 0 < i && lines[i] === ""; --i) {
                        lines.pop();
                    }
                }
            }
        }
    });

    return PhpErorLogParser;
})(EventEmitter);

module.exports = PhpErorLogParser;