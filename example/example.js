'use strict';

var Parser = require('../index');
var fs = require('fs');

var parser = new Parser(0);
parser.addListener('record', function (record) {
    console.log('parsed record', record);
});

var content = fs.readFileSync('/var/log/php_errors.log');
content.toString().split("\n").forEach(function(line) {
    parser.addLine(line);
});
