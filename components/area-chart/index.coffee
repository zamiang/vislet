d3 = require 'd3'
_ = require 'underscore'
Backbone = require "backbone"
moment = require 'moment'
Key = require '../line-graph/key.coffee'
Tooltips = require '../svg-tooltips/index.coffee'

module.exports = class AreaChart extends Backbone.View

  _.extend @prototype, Key
  _.extend @prototype, Tooltips

  margin:
    top: 10
    left: 50
    right: 0
    bottom: 20

  defaults:
    displayKey: false
    interpolate: 'cardinal'
    speed: 500
    colorSet: d3.scale.category20c
    yAxisFormat: (x) -> d3.format(".1%")(x).replace(/\.0+%$/, "%")
    computeYDomain: false

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @label, @speed, @colorSet, @yAxisFormat, @computeYDomain
      @displayKey, @filterDataset, @interpolate } = _.defaults(options, @defaults)
    @render()

  render: ->
    @x = d3.time.scale().range([0, @width])
    @y = d3.scale.linear().range([@height, 0])

    @area = d3.svg.area()
      .interpolate(@interpolate)
      .x((d) => @x(Number(d.date)))
      .y0((d) => @y(d.y0))
      .y1((d) => @y(d.y0 + d.y))

    svg = @svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width + @margin.left + @margin.right)
      .attr("height", @height + @margin.top + @margin.bottom)
      .append("g")
      .attr("transform", "translate(#{@margin.left}, #{@margin.top})")

    @svg = d3.select("##{@$el.attr('id')}")

    flattenedData = @getFlattenedData @startingDataset

    @color = @colorSet()
    @color.domain Object.keys(flattenedData).sort()
    @stack = d3.layout.stack().values((d) -> d.values )

    @lines = @getLines(flattenedData)

    if @computeYDomain
      @y.domain([
        0,
        d3.sum((@lines.map((c) -> d3.max(c.values, (v) -> v.y )))) + 100
      ])

    @x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> Number(d.date) ))

    @drawLines @lines, svg
    @drawKey() if @displayKey
    @appendTooltips @color, svg, @lines
    @drawLineLabels svg

  getLines: (data) ->
    @stack(@color.domain().map((name) ->
      {
        name: name,
        values: Object.keys(data[name]).map((key) ->
          d = data[name][key]
          { date: Number(d.date), y: d.value }
        )
      }
    ))

  getLineValue: (line) -> line.y0 + line.y
  getLineDisplayValue: (line) -> line.y

  getFlattenedData: (startingDataset) ->
    flattenedData = @data[startingDataset][@keys[0]]
    if @filterDataset then @filterDataset(flattenedData) else flattenedData

  drawLines: (lines, svg) ->
    @svgBuildingType = svg.selectAll(".building-type")
      .data(lines)
      .enter().append("g")
      .attr("class", "building-type")

    @svgBuildingType.append("path")
      .attr("class", "area")
      .attr("d", (d) => @area(d.values) )
      .style("fill", (d) => @color(d.name) )

  animateNewArea: (startingDataset) ->
    flattenedData = @getFlattenedData startingDataset
    @lines = @getLines flattenedData

    buildingTypes = @svg
      .selectAll('.building-type .area')
      .data(@lines)
      .transition().duration(@speed)
      .ease('linear')
      .attr("d", (d) => @area(d.values) )

  drawLineLabels: (svg) ->
    xAxis = d3.svg.axis()
      .scale(@x)
      .orient("bottom")
      #.ticks(d3.time.hours)

    yAxis = d3.svg.axis()
      .scale(@y)
      .orient("left")
      .tickFormat(@yAxisFormat)

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,#{@height})")
      .call(xAxis)

    svg.append("g")
      .attr("class", "y axis y-axis")
      .call(yAxis)

    @addLabel(svg, @label) if @label

  addLabel: (g, label) ->
    g.append("text")
      .attr("x", 10)
      .attr("y", @margin.top)
      .style("text-anchor", "start")
      .attr('class', 'label-text')
      .text(label)

  changeLabel: (text) ->
    @svg.selectAll('.label-text').text text
