module.exports = {}
module.exports.leftPad = (number, targetLength) ->
  output = number + ''
  while (output.length < targetLength)
    output = '0' + output
  output

module.exports.formatBBL = (borough, block, lot) ->
  "#{borough}#{module.exports.leftPad(block, 5)}#{module.exports.leftPad(lot, 4)}"
