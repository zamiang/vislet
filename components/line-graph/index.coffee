d3 = require 'd3'
Backbone = require "backbone"
moment = require 'moment'

module.exports = class SvgMap extends Backbone.View

  margin:
    top: 50
    left: 50
    right: 50
    bottom: 50

  initialize: (options) ->
    { @data, @width, @height, @keys } = options
    @render()

  render: ->
    x = d3.time.scale().range([0, @width])
    y = d3.scale.linear().range([@height, 0])

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")

    line = d3.svg.line()
      .interpolate("basis")
      .x((d) -> x(d.date))
      .y((d) -> y(d.value))

    color = d3.scale.category10()

    svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width + @margin.left + @margin.right)
      .attr("height", @height + @margin.top + @margin.bottom)
      .append("g")
      .attr("transform", "translate(#{@margin.left}, #{@margin.top})")

    flattenedData = for key in @keys
      for itemKey in Object.keys(@data[key])
        {
          date: moment(itemKey, 'M-DD-YYYY')
          value: @data[key][itemKey]
        }

    color.domain(@keys)
    lines = color.domain().map((name, index) ->
      {
        name: name
        values: flattenedData[index]
      }
    )

    x.domain(d3.extent(flattenedData[0], (d) -> d.date ))

    y.domain([
      d3.min(lines, (c) -> d3.min(c.values, (v) -> v.value ))
      d3.max(lines, (c) -> d3.max(c.values, (v) -> v.value ))
    ])

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,#{@height})")
      .call(xAxis)

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Sales")

    svgLines = svg.selectAll(".labels")
      .data(lines)
      .enter().append("g")
      .attr("class", "sales")

    svgLines.append("path")
      .attr("class", "line")
      .attr("d", (d) -> line(d.values) )
      .style("stroke", (d) -> color(d.name) )
