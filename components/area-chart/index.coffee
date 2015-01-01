d3 = require 'd3'
Backbone = require "backbone"
moment = require 'moment'

module.exports = class AreaChart extends Backbone.View

  margin:
    top: 20
    left: 50
    right: 20
    bottom: 30

  initialize: (options) ->
    { @data, @width, @height, @keys, @startingDataset, @label } = options
    @render()

  render: ->
    width = @width - @margin.left - @margin.right
    height = @height - @margin.top - @margin.bottom

    x = d3.time.scale().range([0, width])
    y = d3.scale.linear().range([height, 0])

    @area = d3.svg.area()
      .x((d) -> x(d.date))
      .y0((d) -> y(d.y0))
      .y1((d) -> y(d.y0 + d.y) )

    svg = d3.select("body").append("svg")
      .attr("width", @width)
      .attr("height", @height)
      .append("g")
      .attr("transform", "translate(#{@margin.left},#{@margin.top})")

    flattenedData = @getFlattenedData @startingDataset

    @color = d3.scale.category20()
    @color.domain Object.keys(flattenedData)

    stack = d3.layout.stack()
      .values((d) -> d.values )

    x.domain(d3.extent(flattenedData[Object.keys(flattenedData)[0]], (d) -> d.date ))

    @drawLines buildingTypes, @area, color, svg

  getFlattenedData: (startingDataset) ->
    flattenedData = {}
    for key in @keys
      data = @data[startingDataset][key]
      flattenedData[key] =
        for itemKey in Object.keys(data)
          {
            date: moment(itemKey, 'M'),
            value: data[itemKey]
          }
    flattenedData

  drawLines: (buildingTypes, area, color, svg) ->
    @svgBuildingType = svg.selectAll(".building-type")
      .data(buildingTypes)
      .enter().append("g")
      .attr("class", "building-type")

    @svgBuildingType.append("path")
      .attr("class", "area")
      .attr("d", (d) -> area(d.values) )
      .style("fill", (d) -> color(d.name) )

    @svgBuildingType.append("text")
      .datum((d) -> { name: d.name, value: d.values[d.values.length - 1] })
      .attr("transform", (d) -> "translate(#{x(d.value.date)},#{y(d.value.y0 + d.value.y / 2)})")
      .attr("x", -6)
      .attr("dy", ".35em")
      .text((d) -> d.name )

  animateNewArea: (startingDataset) ->
    flattenedData = @getFlattenedData startingDataset
    buildingTypes = @color.domain().map (name) ->
      { name: name, values: flattenedData[name] }

    svg = d3.select("##{@$el.attr('id')}")

    svg.selectAll(".building-type")
      .data(buildingTypes).transition().duration(500)
      .ease("linear")
      .attr("d", (d) => @line(d.values))

  drawKey: (svg, x, y) ->
    formatPercent = d3.format(".0%")

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(formatPercent)

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,#{height})")
      .call(xAxis)

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
