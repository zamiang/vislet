d3 = require 'd3'
Backbone = require "backbone"
moment = require 'moment'
lineGraph = require './index.coffee'

module.exports = class PercentGraph extends lineGraph

  addColor: true
  yAxisFormat: d3.format(".2p")

  formatFixedPercent: d3.format(".1%")
  yAxisFormat: (x) => @formatFixedPercent(x).replace(/\.0+%$/, "%")

  getFlattenedData: (startingDataset) ->
    flattenedData = @data[startingDataset][@keys[0]]
    if @filterDataset then @filterDataset(flattenedData) else flattenedData
