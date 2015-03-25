Backbone = require "backbone"
_ = require 'underscore'
d3 = require 'd3'

module.exports = class BarChart extends Backbone.View

  defaults:
    barHeight: 20
    width: 420
    data: []

  initialize: (options) ->
    { @width, @barHeight, @data } = _.defaults(options, @defaults)
    @drawBarChart @data

  drawBarChart: (data) ->
    x = d3.scale.linear().range([0, @width])
    chart = d3.select "##{@$el.attr('id')}"

    x.domain([0, d3.max(data, (d) -> d.value )])

    console.log @barHeight, data.length

    chart.attr("height", @barHeight * data.length)

    bar = chart.selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("transform", (d, i) => "translate(0, #{i * @barHeight})" )

    bar.append("rect")
      .attr("width", (d) -> x(d.value) )
      .attr("height", @barHeight - 1)

    bar.append("text")
      .attr("x", (d) -> x(d.value) - 3)
      .attr("y", @barHeight / 2)
      .attr("dy", ".35em")
      .text((d) -> d.value )
