d3 = require 'd3'
Backbone = require "backbone"
moment = require 'moment'
lineGraph = require './index.coffee'

module.exports = class PercentGraph extends lineGraph

  parseYear: d3.time.format("%Y").parse
  addColor: true
  yAxisFormat: d3.format(".0%")

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

    flattenedData = @getFlattenedData @startingDataset

    @color = d3.scale.category20()
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

  getFlattenedData: (startingDataset) ->
    flattenedData = {}
    for key in @keys
      data = @data[startingDataset][key]
      @years ||= Object.keys(data)
      dataKeys = Object.keys(data[@years[0]])
      for dataKey in dataKeys
        flattenedData[dataKey] = []
        for year in @years
          flattenedData[dataKey].push { date: @parseYear(year), value: data[year][dataKey] / 100 }
    flattenedData
