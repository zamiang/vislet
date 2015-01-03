d3 = require 'd3'
Backbone = require "backbone"
moment = require 'moment'
lineGraph = require './index.coffee'

module.exports = class PercentGraph extends lineGraph

  addColor: true
  yAxisFormat: d3.format(".0%")

  margin:
    top: 10
    left: 40
    right: 0
    bottom: 20

  render: ->
    x = d3.time.scale().range([0, @width])
    y = d3.scale.linear().range([@height, 0])

    @line = d3.svg.line()
      .interpolate("basis")
      .x((d) -> x(d.date))
      .y((d) -> y(d.value))

    svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width + @margin.left + @margin.right)
      .attr("height", @height + @margin.top + @margin.bottom)
      .append("g")
      .attr("transform", "translate(#{@margin.left}, #{@margin.top})")

    flattenedData = @getFlattenedData(@startingDataset)

    @color = d3.scale.category10()
    @color.domain Object.keys(flattenedData)
    lines = @color.domain().map (name) ->
      { name: name, values: flattenedData[name] }

    x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> d.date ))

    y.domain([
      d3.min(lines, (c) -> d3.min(c.values, (v) -> v.value ))
      d3.max(lines, (c) -> d3.max(c.values, (v) -> v.value + .2 ))
    ])

    @drawKey svg, x, y
    @drawLines lines, @line, @color, svg, x, y
    @appendLineLabels lines, @color, x, y

  getFlattenedData: (startingDataset) ->
    flattenedData = @data[startingDataset][@keys[0]]
    if @filterDataset then @filterDataset(flattenedData) else flattenedData
