d3 = require 'd3'
_ = require 'underscore'
Backbone = require "backbone"
moment = require 'moment'
Key = require '../line-graph/key.coffee'

module.exports = class AreaChart extends Backbone.View

  _.extend @prototype, Key

  margin:
    top: 10
    left: 50
    right: 0
    bottom: 20

  defaults:
    displayKey: false

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @label, @displayKey, @filterDataset } = _.defaults(options, @defaults)
    @render()

  formatFixedPercent: d3.format(".1%")
  yAxisFormat: (x) => @formatFixedPercent(x).replace(/\.0+%$/, "%")

  render: ->
    @x = d3.time.scale().range([0, @width])
    @y = d3.scale.linear().range([@height, 0])

    @area = d3.svg.area()
      .x((d) => @x(d.date))
      .y0((d) => @y(d.y0))
      .y1((d) => @y(d.y0 + d.y))

    svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width + @margin.left + @margin.right)
      .attr("height", @height + @margin.top + @margin.bottom)
      .append("g")
      .attr("transform", "translate(#{@margin.left}, #{@margin.top})")

    flattenedData = @getFlattenedData @startingDataset

    @color = d3.scale.category10()
    @color.domain Object.keys(flattenedData)
    @stack = d3.layout.stack().values((d) ->
      d.values )

    @lines = @getLines(flattenedData)

    @x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> d.date ))

    @drawLineLabels svg
    @drawLines @lines, svg
    @drawKey() if @displayKey

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
    return 'hello'
    flattenedData = @getFlattenedData startingDataset
    svg = d3.select("##{@$el.attr('id')}")

    buildingTypes = svg.selectAll(".building-type")
    transition = buildingTypes.transition().duration(500)
    postTransition = transition.transition()

    # .data(flattenedData)

    transition.selectAll("text")
      .attr("transform", (d) -> "translate(" + x(d.value.date) + "," + y(d.value.y0 + d.value.y) + ")" )

    # .ease("linear")
    # .selectAll('path')
    # .attr("d", (d) => @area(d.values))

  shapeTween: (shape, direction) ->
    (d, i, a) ->
      (t) ->
        shape(if direction then t else 1.0 - t)(d.values)

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
