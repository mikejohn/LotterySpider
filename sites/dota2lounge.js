var dota2lounge;
var dateFormat = require('../component/dateFormat.js');
var $ = require('/usr/local/lib/node_modules/jquery');
var EventProxy = require('/usr/local/lib/node_modules/eventproxy');
var http = require('http');
var mysql = require('/usr/local/lib/node_modules/mysql');

function handleDisconnect() {
    var connection = mysql.createConnection({
        user: 'root',
        password: '123456',
        host: '127.0.0.1',
        port: '3306',
        database: 'lotterSpider',
        charset: 'UTF8_GENERAL_CI',
        timezone: '+8:00'
    });

    connection.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            handleSQLErrOrResultErr(err.code);                                  // server variable configures this)
        }
    });
    return connection;
}


var options = {
    hostname: 'dota2lounge.com',
    path: '',
    port: 80,
    method: 'GET'
};
exports.run = function () {
    var req = http.request(options, function (res) {
        var data = new Buffer(0);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var chunkBuff = new Buffer(chunk);
            var list = [data, chunkBuff];
            data = Buffer.concat(list);
        });
        res.on('end', function (a) {
            var matches = getMatchesFromIndex(data);
            for (var i = 0; i < matches.length; i++) {
                var match = matches[i];
                var opts = {
                    host: options.hostname,
                    method: options.method,
                    port: options.port,
                    path: '/' + match.linkPath
                };
                ;
                options.path = '/' + match.linkPath;
                var reqd = http.request(opts, function (resd) {
                    resd.match = this.match;
                    var datad = new Buffer(0);
                    resd.setEncoding('utf8');
                    resd.on('data', function (chunk) {
                        var chunkBuff = new Buffer(chunk);
                        var list = [datad, chunkBuff];
                        datad = Buffer.concat(list);
                    });
                    resd.on('end', function () {
                        this.match = getMatchDetail(datad, this.match);
                        insertDB(this.match);
                    });
                });
                reqd.match = matches[i];
                reqd.on('error', function (e) {
                    console.log(e);
                });
                reqd.end();
            }
        });
    });
    req.on('error', function (e) {
        console.log(e);
    });
    req.end();
}

function getMatchesFromIndex(buff) {
    var dom = $(buff.toString());
    var divList = dom.find('div.matchmain');
    var matches = [];
    var reg_ID = /^(match\?m=)(\d+)$/,
        reg_LEAGUE = /^\n\s*([\S][\S\s]*[\S])\s*/,
        reg_TIME = /^\n\s*([\w\d][\w\s\d]*[\w\d])\s*/,
        reg_HOURS =  /(\d+)/;

    for (var i = 0; i < divList.length; i++) {
//      for (var i = 0; i < 1; i++) {
        var matchDom = $(divList[i]);
        var match = {};
        //if the match time passed,ignore it
        match.time = $(matchDom.find('div.when')[0]).html();
        match.time = reg_TIME.exec(match.time)[1];
        if (match.time.indexOf('ago') !== -1) {
            continue;
        } else {
            match.time = reg_HOURS.exec(match.time)[0];
            var date = new Date();
            date.setHours(date.getHours() + Number(match.time),0,0,0);
            match.time = dateFormat.format(date, 'mysqlDateTime');
        }
        match.linkPath = matchDom.find('a').attr('href');
        match.id = reg_ID.exec(match.linkPath)[2];
        match.teamA = $(matchDom.find('div.teamtext')[0]).find('b').html();
        match.teamApercent = $(matchDom.find('div.teamtext')[0]).find('i').html();
        match.teamB = $(matchDom.find('div.teamtext')[1]).find('b').html();
        match.teamBpercent = $(matchDom.find('div.teamtext')[1]).find('i').html();
        match.league = $(matchDom.find('div.when')[1]).html();
        match.league = reg_LEAGUE.exec(match.league)[1];
        matches.push(match);
    }
    return matches;
};
function getMatchDetail(buff, match) {

    var dom = $(buff.toString());
    var detailDiv = $(dom.find('div#main').children()[0]).find('div.full');
    var teamADIV = detailDiv.find('div.half')[0];
    var teamBDIV = detailDiv.find('div.half')[1];
    var teamAPR = {
        rares: [],
        uncommons: [],
        commons: []
    };
    var teamBPR = {
        rares: [],
        uncommons: [],
        commons: []
    };
    var reg_PR = /^\d\.?\d?/;
    var PRs = $($(teamADIV).children()[0]).html().split('<br />');
    teamAPR.rares.push(reg_PR.exec(PRs[1])[0]);
    teamAPR.rares.push(reg_PR.exec(PRs[2])[0]);
    teamAPR.rares.push(reg_PR.exec(PRs[3])[0]);
    teamAPR.rares.push(reg_PR.exec(PRs[4])[0]);
    PRs = $($(teamADIV).children()[1]).html().split('<br />');
    teamAPR.uncommons.push(reg_PR.exec(PRs[1])[0]);
    teamAPR.uncommons.push(reg_PR.exec(PRs[2])[0]);
    teamAPR.uncommons.push(reg_PR.exec(PRs[3])[0]);
    teamAPR.uncommons.push(reg_PR.exec(PRs[4])[0]);
    PRs = $($(teamADIV).children()[2]).html().split('<br />');
    teamAPR.commons.push(reg_PR.exec(PRs[1])[0]);
    teamAPR.commons.push(reg_PR.exec(PRs[2])[0]);
    teamAPR.commons.push(reg_PR.exec(PRs[3])[0]);
    teamAPR.commons.push(reg_PR.exec(PRs[4])[0]);
    PRs = $($(teamBDIV).children()[0]).html().split('<br />');
    teamBPR.commons.push(reg_PR.exec(PRs[1])[0]);
    teamBPR.commons.push(reg_PR.exec(PRs[2])[0]);
    teamBPR.commons.push(reg_PR.exec(PRs[3])[0]);
    teamBPR.commons.push(reg_PR.exec(PRs[4])[0]);
    PRs = $($(teamBDIV).children()[1]).html().split('<br />');
    teamBPR.uncommons.push(reg_PR.exec(PRs[1])[0]);
    teamBPR.uncommons.push(reg_PR.exec(PRs[2])[0]);
    teamBPR.uncommons.push(reg_PR.exec(PRs[3])[0]);
    teamBPR.uncommons.push(reg_PR.exec(PRs[4])[0]);
    PRs = $($(teamBDIV).children()[2]).html().split('<br />');
    teamBPR.rares.push(reg_PR.exec(PRs[1])[0]);
    teamBPR.rares.push(reg_PR.exec(PRs[2])[0]);
    teamBPR.rares.push(reg_PR.exec(PRs[3])[0]);
    teamBPR.rares.push(reg_PR.exec(PRs[4])[0]);

    var reg_Total = /\D*(\d+)\D+(\d+)\D*/;
    var totalNum = reg_Total.exec($($(dom.find('div#main').children()[1]).find('div.full')[0]).html());
    match.teamAPR = teamAPR;
    match.teamBPR = teamBPR;
    match.people = totalNum[1];
    match.items = totalNum[2];
    //console.dir(match);
    return match;
};
function insertDB(match) {
    var connection = handleDisconnect();
    //sort teamAName ,teamBName order by defualt
    //make A vs B same as B vs A
    var sortName = [match.teamA,match.teamB];
    sortName.sort();
    if(sortName[0] !== match.teamA) {
        var temp = match.teamB;
        match.teamB = match.teamA;
        match.teamA = temp;
        temp = match.teamBpercent;
        match.teamBpercent = match.teamApercent;
        match.teamApercent = temp;
        temp = match.teamBPR;
        match.teamBPR = match.teamAPR;
        match.teamAPR = temp;
    }
    var teamAId, teamBId, leagueId;
    var ep = EventProxy.create('getAId','getBId','getLeagueId',function() {
        var query = connection.query("INSERT INTO `lotterSpider`.`lounge` (`leagueId`, `AId`, `BId`, `time`,`querytime`, `Apercent`, `Bpercent`, `ARare1`, `ARare2`, `ARare3`, `ARare4`, `AUncommon1`, `AUncommon2`, `AUncommon3`, `AUncommon4`, `Acommon1`, `Acommon2`, `Acommon3`, `Acommon4`, `BRare1`, `BRare2`, `BRare3`, `BRare4`, `BUncommon1`, `BUncommon2`, `BUncommon3`, `BUncommon4`, `Bcommon1`, `Bcommon2`, `Bcommon3`, `Bcommon4`, `people`,`items`) VALUES " +
            "(?, ?, ?, ?, NOW(),?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            [leagueId,
                teamAId,
                teamBId,
                match.time,
                match.teamApercent,
                match.teamBpercent,
                match.teamAPR.rares[0],
                match.teamAPR.rares[1],
                match.teamAPR.rares[2],
                match.teamAPR.rares[3],
                match.teamAPR.uncommons[0],
                match.teamAPR.uncommons[1],
                match.teamAPR.uncommons[2],
                match.teamAPR.uncommons[3],
                match.teamAPR.commons[0],
                match.teamAPR.commons[1],
                match.teamAPR.commons[2],
                match.teamAPR.commons[3],
                match.teamBPR.rares[0],
                match.teamBPR.rares[1],
                match.teamBPR.rares[2],
                match.teamBPR.rares[3],
                match.teamBPR.uncommons[0],
                match.teamBPR.uncommons[1],
                match.teamBPR.uncommons[2],
                match.teamBPR.uncommons[3],
                match.teamBPR.commons[0],
                match.teamBPR.commons[1],
                match.teamBPR.commons[2],
                match.teamBPR.commons[3],
                match.people,
                match.items],
            function (err, result) {
                if (err) throw err;
                if (result.affectedRows === 1) {
                    closeConnectoinWithMSG(connection,'Done');
                    return;
                } else {
                    closeConnectoinWithMSG(connection,'Result Error!'+this.sql);
                    //TOdO roll back
                }
            });
    });
    connection.query("select id from ls_Team where name_pinnaclesports =" + connection.escape(match.teamA), function (err, rows) {
        if (err) throw err;
        if (rows.length === 1) {
            teamAId = rows[0].id;
            ep.emit('getAId');
        } else if (rows.length === 0) {
            connection.query("INSERT INTO `lotterSpider`.`ls_Team`(`name`,`name_pinnaclesports`) VALUES "+
                "(?,?)",
                [match.teamA,match.teamA],
                function (err,result) {
                    if (err) throw err;
                    teamAId = result.insertId;
                    ep.emit('getAId');
                }
            );
        } else {
            closeConnectoinWithMSG(connection,'Result Error!'+this.sql);
        }
    });
    connection.query("select id from ls_Team where name_pinnaclesports =" + connection.escape(match.teamB), function (err, rows) {
        if (err) throw err;
        if (rows.length === 1) {
            teamBId = rows[0].id;
            ep.emit('getBId');
        } else if (rows.length === 0) {
            connection.query("INSERT INTO `lotterSpider`.`ls_Team`(`name`,`name_pinnaclesports`) VALUES "+
                "(?,?)",
                [match.teamB,match.teamB],
                function (err,result) {
                    if (err) throw err;
                    teamBId = result.insertId;
                    ep.emit('getBId');
                }
            );
        } else {
            closeConnectoinWithMSG(connection,'Result Error!'+this.sql);
        }
    });
    connection.query("select id from ls_League where year = 2013 and name_pinnaclesports =" + connection.escape(match.league), function (err, rows) {
        if (err) throw err;
        if (rows.length === 1) {
            leagueId = rows[0].id;
            ep.emit('getLeagueId');
        } else if (rows.length === 0) {
            connection.query("INSERT INTO `lotterSpider`.`ls_League`(`year`,`name`,`name_pinnaclesports`) VALUES "+
                "(2013,?,?)",
                [match.league,match.league],
                function (err,result) {
                    if (err) throw err;
                    leagueId = result.insertId;
                    ep.emit('getLeagueId');
                }
            );
        } else {
            closeConnectoinWithMSG(connection,'Result Error!'+this.sql);
        }
    });
}
function closeConnectoinWithMSG(connection,msg) {
    console.log(msg);
    connection.end(function (err) {
        if (err) throw err;
    });
}