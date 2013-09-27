exports.MOD = function (a) {
    this.num = a;
};
exports.MOD.prototype.returnGlobal  = function () {
    return this.num;
}