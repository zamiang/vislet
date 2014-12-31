d3 = require 'd3'
Backbone = require "backbone"
moment = require 'moment'

module.exports = class SvgMap extends Backbone.View

  margin:
    top: 10
    left: 80
    right: 0
    bottom: 20

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @label } = options
    @render()

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

    @color = d3.scale.category10()
    @color.domain Object.keys(flattenedData)
    lines = @color.domain().map (name) ->
      { name: name, values: flattenedData[name] }

    x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> d.date ))

    y.domain([
      d3.min(lines, (c) -> d3.min(c.values, (v) -> v.value ))
      d3.max(lines, (c) -> d3.max(c.values, (v) -> v.value ))
    ])

    @drawKey svg, x, y
    @drawLines lines, @line, @color, svg

  getFlattenedData: (startingDataset) ->
    flattenedData = {}
    for key in @keys
      data = @data[startingDataset][key]
      flattenedData[key] =
        for itemKey in Object.keys(data)
          {
            date: moment(itemKey, 'M-DD-YYYY'),
            value: data[itemKey]
          }

      # Compute averages
      totals = {}
      for dataSetKey in Object.keys(@data)
        unless dataSetKey == 'ALL'
          data = @data[dataSetKey][key]
          for itemKey in Object.keys(data)
            totals[itemKey] ||= []
            totals[itemKey].push data[itemKey]

      flattenedData["#{key}-mean"] =
        for totalKey in Object.keys(totals)
          {
            date: moment(totalKey, 'M-DD-YYYY'),
            value: d3.mean(totals[totalKey])
          }
    flattenedData

  drawKey: (svg, x, y) ->
    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")

    svg.append("g")
      .attr("class", "x-axis axis")
      .attr("transform", "translate(0,#{@height})")
      .call(xAxis)

    svg.append("g")
      .attr("class", "y-axis axis")
      .call(yAxis)
      .append("text")
      .attr("x", @width)
      .attr("y", @margin.top)
      .style("text-anchor", "end")
      .attr('class', 'label-text')
      .text(@label)

  drawLines: (lines, line, color, svg) ->
    @svgLines = svg.selectAll(".labels")
      .data(lines)
      .enter().append("g")
      .attr("class", "sales")

    @svgLines.append("path")
      .attr("class", (d) -> if d.name.indexOf('-mean') > -1 then 'line mean-line' else 'line')
      .attr("d", (d) -> line(d.values) )

  animateNewArea: (startingDataset) ->
    flattenedData = @getFlattenedData startingDataset
    lines = @color.domain().map (name) ->
      { name: name, values: flattenedData[name] }

    svg = d3.select("##{@$el.attr('id')}")

    svg.selectAll(".sales .line")
      .data(lines).transition().duration(500)
      .ease("linear")
      .attr("d", (d) => @line(d.values))
