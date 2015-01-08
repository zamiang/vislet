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

  speed: 500
  defaults:
    displayKey: false
    interpolate: 'cardinal'

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @label,
      @displayKey, @filterDataset, @interpolate } = _.defaults(options, @defaults)
    @render()

  formatFixedPercent: d3.format(".1%")
  yAxisFormat: (x) => @formatFixedPercent(x).replace(/\.0+%$/, "%")

  render: ->
    @x = d3.time.scale().range([0, @width])
    @y = d3.scale.linear().range([@height, 0])

    @area = d3.svg.area()
      .interpolate(@interpolate)
      .x((d) => @x(d.date))
      .y0((d) => @y(d.y0))
      .y1((d) => @y(d.y0 + d.y))

    svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width + @margin.left + @margin.right)
      .attr("height", @height + @margin.top + @margin.bottom)
      .append("g")
      .attr("transform", "translate(#{@margin.left}, #{@margin.top})")

    @svg = d3.select("##{@$el.attr('id')}")

    flattenedData = @getFlattenedData @startingDataset

    @color = d3.scale.category20c()
    @color.domain Object.keys(flattenedData)
    @stack = d3.layout.stack().values((d) -> d.values )

    @lines = @getLines(flattenedData)

    @x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> d.date ))

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
          { date: d.date, y: d.value }
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

    svg = d3.select("##{@$el.attr('id')}")

    buildingTypes = svg
      .selectAll('.building-type .area')
      .data(@lines)
      .transition().duration(@speed)
      .ease('linear')
      .attr("d", (d) => @area(d.values) )

  drawLineLabels: (svg) ->
    xAxis = d3.svg.axis()
      .scale(@x)
      .orient("bottom")

    yAxis = d3.svg.axis()
      .scale(@y)
      .orient("left")
      .tickFormat(@yAxisFormat)

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,#{@height})")
      .call(xAxis)

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
