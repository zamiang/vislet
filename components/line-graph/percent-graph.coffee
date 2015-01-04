d3 = require 'd3'
Backbone = require "backbone"
moment = require 'moment'
lineGraph = require './index.coffee'

module.exports = class PercentGraph extends lineGraph

  addColor: true
  yAxisFormat: d3.format(".0%")

  getFlattenedData: (startingDataset) ->
    flattenedData = @data[startingDataset][@keys[0]]
    if @filterDataset then @filterDataset(flattenedData) else flattenedData
