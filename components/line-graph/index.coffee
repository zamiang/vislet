d3 = require 'd3'
_ = require 'underscore'
Backbone = require "backbone"
Tooltips = require './tooltips.coffee'
Transition = require './transition.coffee'
Key = require './key.coffee'

module.exports = class LineGraph extends Backbone.View
  _.extend @prototype, Tooltips
  _.extend @prototype, Transition
  _.extend @prototype, Key

  speed: 500
  margin:
    top: 10
    left: 80
    right: 0
    bottom: 20

  defaults:
    interpolate: 'cardinal'

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @interpolate, @handleHover
      @label, @filterDataset, @displayLineLabels, @displayKey } = _.defaults(options, @defaults)
    @render()

  getFlattenedData: (startingDataset) ->
    flattenedData = {}
    for key in @keys
      if key.indexOf('-mean') > -1
        flattenedData[key] = @data['ALL'][key]
      else
        flattenedData[key] = @data[startingDataset][key]
    flattenedData

  render: ->
    @x = d3.time.scale().range([0, @width])
    @y = d3.scale.linear().range([@height, 0])

    @line = d3.svg.line()
      .interpolate(@interpolate)
      .x((d) => @x(d.date))
      .y((d) => @y(d.value))

    svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width + @margin.left + @margin.right)
      .attr("height", @height + @margin.top + @margin.bottom)
      .append("g")
      .attr("transform", "translate(#{@margin.left}, #{@margin.top})")

    flattenedData = @getFlattenedData @startingDataset

    @color = d3.scale.category10()
    @color.domain Object.keys(flattenedData)
    @lines = @color.domain().map (name) ->
      { name: name, values: flattenedData[name] }

    @x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> d.date ))

    @y.domain([
      d3.min(@lines, (c) -> d3.min(c.values, (v) -> v.value ))
      d3.max(@lines, (c) -> d3.max(c.values, (v) -> v.value ))
    ])

    @drawAxis svg
    @drawLines @line, @color, svg
    @drawLineLabels(@color) if @displayLineLabels
    @drawKey() if @displayKey

  drawAxis: (svg) ->
    @xAxis = d3.svg.axis()
      .scale(@x)
      .orient("bottom")

    @yAxis = d3.svg.axis()
      .scale(@y)
      .orient("left")

    @yAxis.tickFormat(@yAxisFormat) if @yAxisFormat

    svg.append("g")
      .attr("class", "x-axis axis")
      .attr("transform", "translate(0,#{@height})")
      .call(@xAxis)

    g = svg.append("g")
      .attr("class", "y-axis axis")
      .call(@yAxis)

    @addLabel(g, @label) if @label

  addLabel: (g, label) ->
    g.append("text")
      .attr("x", @width)
      .attr("y", @margin.top)
      .style("text-anchor", "end")
      .attr('class', 'label-text')
      .text(label)

  drawLines: (line, color, svg) ->
    @svgLines = svg.selectAll(".labels")
      .data(@lines)
      .enter().append("g")
      .attr("class", "sales")

    paths = @svgLines.append("path")
      .attr("class", (d) -> if d.name.indexOf('-mean') > -1 then 'line mean-line' else 'line')
      .attr("d", (d) -> line(d.values) )

    if @addColor
      paths.style("stroke", (d) -> color(d.name) )

    @appendTooltips color, svg

  drawLineLabels: (color) ->
    @svgLines.append("text")
      .datum((d) -> { name: d.name, value: d.values[d.values.length - 1] } )
      .attr("transform", (d) => "translate(#{@x(d.value.date)},#{@y(d.value.value)})" )
      .attr("x", 3)
      .attr('class', 'line-label')
      .style("fill", (d) -> color(d.name) )
      .text((d) -> d.name )
