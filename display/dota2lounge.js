var dota2lounge;
var dateFormat = require('../component/dateFormat.js');
var $ = require('/usr/local/lib/node_modules/jquery');
var EventProxy = require('/usr/local/lib/node_modules/eventproxy');
var mysql = require('/usr/local/lib/node_modules/mysql');
function connection () {
    var connection = mysql.createConnection({
        user: 'root',
        password: '123456',
        host: '127.0.0.1',
        port: '3306',
        database: 'lotterSpider',
        charset: 'UTF8_GENERAL_CI',
        timezone: '+8:00'
    });
    connection.connect(function (err) {
        if (err) {
            console.log('error when connecting to db:', err);
            process.exit(1);
        }
    });
}


