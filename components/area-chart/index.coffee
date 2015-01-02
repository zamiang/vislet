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

    svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width)
      .attr("height", @height)
      .append("g")
      .attr("transform", "translate(#{@margin.left},#{@margin.top})")

    flattenedData = @getFlattenedData @startingDataset

    console.log flattenedData

    @color = d3.scale.category20()
    @color.domain Object.keys(flattenedData)

    years = for year in @years
      moment("1-01-#{year}", 'M-DD-YYYY')

    x.domain(d3.extent(years))

    @drawKey svg, x, y
    @drawLines flattenedData, @area, @color, svg, x, y

  getFlattenedData: (startingDataset) ->
    stack = d3.layout.stack().values((d) -> d.values )
    parseDate = d3.time.format("%Y").parse
    flattenedData = []

    for key in @keys
      data = @data[startingDataset][key]
      @years ||= Object.keys(data)
      dataKeys = Object.keys(data[@years[0]])
      for dataKey in dataKeys
        values =
          for year in @years
            {
                date: parseDate(year)
                y: data[year][dataKey] / 100
            }
        flattenedData.push { name: dataKey, values: values }
    stack(flattenedData)

  drawLines: (buildingTypes, area, color, svg, x, y) ->
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
      .attr("transform", "translate(0,#{@height - @margin.top - @margin.bottom})")
      .call(xAxis)

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
