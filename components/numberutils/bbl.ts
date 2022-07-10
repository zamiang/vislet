module.exports = {};
module.exports.leftPad = (number, targetLength) => {
    var output;
    output = number + "";
    while (output.length < targetLength) {
        output = "0" + output;
    }
    return output;
};

module.exports.formatBBL = (borough, block, lot) => borough + (module.exports.leftPad(block, 5)) + (module.exports.leftPad(lot, 4));
