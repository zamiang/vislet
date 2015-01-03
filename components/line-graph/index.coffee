d3 = require 'd3'
Backbone = require "backbone"

module.exports = class LineGraph extends Backbone.View

  speed: 500
  margin:
    top: 10
    left: 80
    right: 0
    bottom: 20

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @label } = options
    @render()

  getFlattenedData: (startingDataset) ->
    flattenedData = {}
    for key in @keys
      flattenedData[key] = @data[startingDataset][key]
    flattenedData

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

  drawKey: (svg, x, y) ->
    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")

    yAxis.tickFormat(@yAxisFormat) if @yAxisFormat

    svg.append("g")
      .attr("class", "x-axis axis")
      .attr("transform", "translate(0,#{@height})")
      .call(xAxis)

    g = svg.append("g")
      .attr("class", "y-axis axis")
      .call(yAxis)

    @yAxis = yAxis
    @y = y

    @addLabel(g, @label) if @label

  addLabel: (g, label) ->
    g.append("text")
      .attr("x", @width)
      .attr("y", @margin.top)
      .style("text-anchor", "end")
      .attr('class', 'label-text')
      .text(label)

  drawLines: (lines, line, color, svg) ->
    @svgLines = svg.selectAll(".labels")
      .data(lines)
      .enter().append("g")
      .attr("class", "sales")

    paths = @svgLines.append("path")
      .attr("class", (d) -> if d.name.indexOf('-mean') > -1 then 'line mean-line' else 'line')
      .attr("d", (d) -> line(d.values) )

    if @addColor
      paths.style("stroke", (d) -> color(d.name) )

  animateNewArea: (startingDataset) ->
    flattenedData = @getFlattenedData startingDataset
    lines = @color.domain().map (name) ->
      { name: name, values: flattenedData[name] }

    svg = d3.select("##{@$el.attr('id')}")

    @rescaleYAxis(lines, svg)

    svg.selectAll(".sales .line")
      .data(lines).transition().duration(@speed)
      .ease("linear")
      .attr("d", (d) => @line(d.values))

  rescaleYAxis: (lines, svg) ->
    @y.domain([
      d3.min(lines, (c) -> d3.min(c.values, (v) -> v.value ))
      d3.max(lines, (c) -> d3.max(c.values, (v) -> v.value ))
    ])
    svg.select(".y-axis")
      .transition().duration(@speed).ease("sin-in-out")
      .call(@yAxis)
