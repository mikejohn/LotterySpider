var pinnacleSports;
var $ = require('jquery');
exports.decode = function (buffer) {
      //console.log(buffer.toString());
      var dom = $(buffer.toString());
    var table = dom.find('table.linesTbl');
    table[0].remove();
    table[0].remove();
    table[table.length-1].remove();
    table[table.length-1].remove();
    console.dir(table);
}