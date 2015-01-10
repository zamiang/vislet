d3 = require 'd3'
_ = require 'underscore'
Backbone = require "backbone"
Tooltips = require '../svg-tooltips/index.coffee'
Transition = require './transition.coffee'
Key = require './key.coffee'

module.exports = class LineGraph extends Backbone.View
  _.extend @prototype, Tooltips
  _.extend @prototype, Transition
  _.extend @prototype, Key

  speed: 500
  margin:
    top: 10
    left: 50
    right: 0
    bottom: 20

  defaults:
    interpolate: 'cardinal'

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @interpolate, @handleHover, @yAxisFormat
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

    @svg = d3.select("##{@$el.attr('id')}")

    flattenedData = @getFlattenedData @startingDataset

    @lines = @getLines flattenedData, @startingDataset

    @x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> d.date ))

    @y.domain([
      d3.min(@lines, (c) -> d3.min(c.values, (v) -> v.value ))
      d3.max(@lines, (c) -> d3.max(c.values, (v) -> v.value ))
    ])

    @drawAxis svg
    @drawLines @line, @color, svg
    @drawKey() if @displayKey
    @appendTooltips @color, svg, @lines
    @drawLineLabels(@color) if @displayLineLabels

  getLines: (flattenedData, startingDataset, compareDataset) ->
    lines = for name in Object.keys(flattenedData)
      {
        id: if name.indexOf('-mean') > -1 then 'Borough Average' else startingDataset
        name: name,
        values: flattenedData[name]
      }

    if compareDataset
      flattenedData = @getFlattenedData compareDataset
      lines.push {
        name: 'compare-dataset'
        id: compareDataset
        values: flattenedData[@keys[0]]
      }
    else
      lines.push { name: 'compare-dataset', values: [] }
    lines

  color: (name) ->
    if name.indexOf('-mean') > -1
      'lightgray'
    else if name.indexOf('compare-') > -1
      '#D53F50'
    else
      'steelblue'

  drawAxis: (svg) ->
    @xAxis = d3.svg.axis()
      .scale(@x)
      .orient("bottom")

    @yAxis = d3.svg.axis()
      .scale(@y)
      .orient("left")
      .ticks(7)

    @yAxis.tickFormat(@yAxisFormat) if @yAxisFormat

    svg.append("g")
      .attr("class", "x-axis axis")
      .attr("transform", "translate(0,#{@height})")
      .call(@xAxis)

    g = svg.append("g")
      .attr("class", "y-axis axis")
      .call(@yAxis)

    @addLabel(svg, @label) if @label

  addLabel: (g, label) ->
    g.append("text")
      .attr("y", 5)
      .attr('x', 10)
      .attr("dy", "1em")
      .style("text-anchor", "start")
      .attr('class', 'label-text')
      .text(label)

  drawLines: (line, color, svg) ->
    @svgLines = svg.selectAll(".labels")
      .data(@lines)
      .enter().append("g")
      .attr("class", "sales")

    paths = @svgLines.append("path")
      .attr("class", 'line')
      .attr("d", (d) -> line(d.values) )

    paths.style("stroke", (d) -> color(d.name) )

  drawLineLabels: (color) ->
    @svgLines.append("text")
      .datum((d) -> { name: d.name, value: d.values[d.values.length - 1] } )
      .attr("transform", (d) => "translate(#{@x(d.value.date)},#{@y(d.value.value)})" )
      .attr("x", 3)
      .attr('class', 'line-label')
      .style("fill", (d) -> color(d.name) )
      .text((d) -> d.name )
