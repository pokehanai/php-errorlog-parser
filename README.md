PHP Error Log Parser
====================

Parse PHP error log

### Installation

```sh
$ npm install -save php-errorlog-parser
```

### Usage

```js
var Parser = require('php-errorlog-parser');
var fs = require('fs');

var parser = new Parser(0);
parser.addListener('record', function (record) {
    console.log('parsed record', record);
});

var content = fs.readFileSync('/var/log/php_errors.log');
content.toString().split("\n").forEach(function(line) {
    parser.addLine(line);
});
```

### methods

#### constructor(threshold)

##### parameter: `threshold`

Wait time for accept continuous line input, in milli seconds.

`threshold` stands for multi line parsing.
If a bunch of lines come within `threashold`, the parser can parse them together.

#### addLine(line)

Add new line to the parser.

##### parameter: `line`

New line string.

The parser expect that `line` has no `CR` nor `LF` in its tail.

### events

#### `record`

Emitted when a parsed record is formed.

##### parameter: `record`

| key          | type       | description        |
| :--          | :--        | :--                |
| `time`       | Date       | log timestamp      |
| `level`      | string     | log level          |
| `lines`      | array      | log lines          |
| `stacktrace` | array/null | strace trace lines |

#### `error`

Emmited when an error occured

#### parameger: `error`

Error description.

### License

MIT
