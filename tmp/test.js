var MOD = require('./mod1.js');
var mod1 = new MOD.MOD(3),mod2 = new MOD.MOD(5);
console.log('mod1 '+mod1.returnGlobal());
console.log('mod2 '+mod2.returnGlobal());
mod1.num = 13;
mod2.num = 15;
console.log('mod1 '+mod1.returnGlobal());
console.log('mod2 '+mod2.returnGlobal());