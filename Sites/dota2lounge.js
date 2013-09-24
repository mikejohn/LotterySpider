var date = new Date();
date.setHours(date.getHours()+2);
console.log(date.toString());
process.exit(0);

var dota2lounge;
var $ = require('jquery');
var http = require('http');
var mysql = require('mysql'),
    connection = mysql.createConnection({
       user : 'root',
       password : '123456',
       host : '127.0.0.1',
       port : '3306',
       database : 'lotterSpider',
       charset : 'UTF8_GENERAL_CI',
       timezone : '+8:00'
    });
var connection;

function handleDisconnect() {
    connection = mysql.createConnection({
        user : 'root',
        password : '123456',
        host : '127.0.0.1',
        port : '3306',
        database : 'lotterSpider',
        charset : 'UTF8_GENERAL_CI',
        timezone : '+8:00'
    });

    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            handleSQLErrOrResultErr(err.code);                                  // server variable configures this)
        }
    });
}

handleDisconnect();
var options = {
    hostname : 'dota2lounge.com',
    path : '',
    port : 80,
    method : 'GET'
};
exports.run = function () {
    var match = {
        teamA:'Na\'Vi',
        teamB:'PR',
        league:'Starseries'
    };
    insertDB(match);
    /*
    var req = http.request(options,function(res) {
        var data = new Buffer(0);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            chunkBuff = new Buffer(chunk);
            var list = [data,chunkBuff];
            data = Buffer.concat(list);
        });
        res.on('end',function(a) {
            var matches = getMatchesFromIndex(data);
            for(var i=0;i<matches.length;i++) {
                var match = matches[i];
                var opts = {
                    host : options.hostname,
                    method : options.method,
                    port : options.port,
                    path : '/'+match.linkPath
                };                            ;
                options.path = '/'+match.linkPath;
                var http = require('http');
                var reqd = http.request(opts,function(resd) {
                    console.log('request:'+this.num);
                    resd.match=this.match;
                    var datad = new Buffer(0);
                    resd.setEncoding('utf8');
                    resd.on('data', function (chunk) {
                        chunkBuff = new Buffer(chunk);
                        var list = [datad,chunkBuff];
                        datad = Buffer.concat(list);
                    });
                    resd.on('end',function() {
                        getMatchDetail(datad,this.match);
                    });
                });
                reqd.match = matches[i];
                reqd.on('error', function(e) {
                    console.log('there'+e);
                });
                reqd.end();
            }
        });
    });
    req.on('error', function(e) {
        console.log('here'+e);
    });
    req.end();
    */
}

function getMatchesFromIndex (buff) {
    var dom = $(buff.toString());
    var divList = dom.find('div.matchmain');
    var matches = [];
    var reg_ID = /^(match\?m=)(\d+)$/,
        reg_LEAGUE = /^\n\s*([\w\d][\w\s\d]*[\w\d])\s*/,
        reg_TIME = /^\n\s*([\w\d][\w\s\d]*[\w\d])\s*/;
    for(var i=0;i<divList.length;i++) {
        var matchDom = $(divList[i]);
        var match = {};
        match.linkPath = matchDom.find('a').attr('href');
        match.id = reg_ID.exec(match.linkPath)[2];
        match.teamA = $(matchDom.find('div.teamtext')[0]).find('b').html();
        match.teamApercent = $(matchDom.find('div.teamtext')[0]).find('i').html();
        match.teamB = $(matchDom.find('div.teamtext')[1]).find('b').html();
        match.teamBpercent = $(matchDom.find('div.teamtext')[1]).find('i').html();
        match.league = $(matchDom.find('div.when')[1]).html();
        match.league = reg_LEAGUE.exec(match.league)[1];
        match.time = $(matchDom.find('div.when')[0]).html();
        match.time = reg_TIME.exec(match.time)[1];
        matches.push(match);
    }
    return matches;
};
function getMatchDetail (buff,match) {

    var dom = $(buff.toString());
    var detailDiv =$(dom.find('div#main').children()[0]).find('div.full');
    var teamADIV = detailDiv.find('div.half')[0];
    var teamBDIV = detailDiv.find('div.half')[1];
    var teamAPR = {
        rares : [],
        uncommons : [],
        commons : []
    };
    var teamBPR = {
        rares : [],
        uncommons : [],
        commons : []
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
    var PRs = $($(teamBDIV).children()[0]).html().split('<br />');
    teamBPR.rares.push(reg_PR.exec(PRs[1])[0]);
    teamBPR.rares.push(reg_PR.exec(PRs[2])[0]);
    teamBPR.rares.push(reg_PR.exec(PRs[3])[0]);
    teamBPR.rares.push(reg_PR.exec(PRs[4])[0]);
    PRs = $($(teamBDIV).children()[1]).html().split('<br />');
    teamBPR.uncommons.push(reg_PR.exec(PRs[1])[0]);
    teamBPR.uncommons.push(reg_PR.exec(PRs[2])[0]);
    teamBPR.uncommons.push(reg_PR.exec(PRs[3])[0]);
    teamBPR.uncommons.push(reg_PR.exec(PRs[4])[0]);
    PRs = $($(teamBDIV).children()[2]).html().split('<br />');
    teamBPR.commons.push(reg_PR.exec(PRs[1])[0]);
    teamBPR.commons.push(reg_PR.exec(PRs[2])[0]);
    teamBPR.commons.push(reg_PR.exec(PRs[3])[0]);
    teamBPR.commons.push(reg_PR.exec(PRs[4])[0]);
    var reg_Total = /\D*(\d+)\D+(\d+)\D*/;
    var totalNum = reg_Total.exec($($(dom.find('div#main').children()[1]).find('div.full')[0]).html());
//  console.dir(a);
    match.teamAPR = teamAPR;
    match.teamBPR = teamBPR;
    match.people = totalNum[1];
    match.items = totalNum[2];
    console.dir(match);
    return match;
};
function insertDB (match) {
    var teamAId,teamBId,leagueId;
    connection.query("select id from ls_Team where name_sl =" + connection.escape(match.teamA),function(err,rows) {
        if(rows.length ===1) {
            teamAId = rows[0].id;
        } else {
            handleSQLErrOrResultErr('Result Error!');
        }
    });
    connection.query("select id from ls_Team where name_sl =" + connection.escape(match.teamB),function(err,rows) {
        if(rows.length ===1) {
            teamBId = rows[0].id;
        } else {
            handleSQLErrOrResultErr('Result Error!');
        }
    });
    connection.query("select id from ls_League where year = 7 and name ="+connection.escape(match.league),function(err,rows) {
        console.dir(rows)
        if(rows.length ===1) {
            leagueId = rows[0].id;
        } else {
            handleSQLErrOrResultErr('Result Error!');
        }
    });
//    connection.query("INSERT INTO `lotterSpider`.`lounge` (`leagueId`, `AId`, `BId`, `time`, `Apercent`, `Bpercent`, `ARare1`, `ARare2`, `ARare3`, `ARare4`, `AUncommon1`, `AUncommon2`, `AUncommon3`, `AUncommon4`, `Acommon1`, `Acommon2`, `Acommon3`, `Acommon4`, `BRare1`, `BRare2`, `BRare3`, `BRare4`, `BUncommon1`, `BUncommon2`, `BUncommon3`, `BUncommon4`, `Bcommon1`, `Bcommon2`, `Bcommon3`, `Bcommon4`, `people`) VALUES " +
//        "(0, 0, 0, '2009-9-09', '12', '1', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);",function(err,rows){
//        console.dir(err);
//        console.dir(rows);
//    });
}
function handleSQLErrOrResultErr (msg) {
    console.log(msg);
    connection.end(function(err){
        console.dir(err);
        process.exit(1);
    });
}