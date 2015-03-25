Backbone = require "backbone"
_ = require 'underscore'
d3 = require 'd3'

module.exports = class BarChart extends Backbone.View

  defaults:
    barHeight: 12
    width: 160
    data: []
    label: false
    marginTop: 25
    marginLeft: 25
    marginRight: 50

  initialize: (options) ->
    { @width, @barHeight, @data, @label, @marginTop, @marginLeft, @marginRight } = _.defaults(options, @defaults)
    @drawBarChart @data

  formatOutput: (value) ->
    Number(value.toFixed(2)).toLocaleString()

  addLabel: (g, label) ->
    g.append("text")
      .attr("y", 5)
      .attr('x', @marginLeft)
      .attr("dy", "1em")
      .style("text-anchor", "start")
      .attr('class', 'label-text')
      .text(label)

  drawBarChart: (data) ->
    x = d3.scale.linear().range([0, @width - @marginLeft])
    chart = d3.select "##{@$el.attr('id')}"

    x.domain([0, d3.max(data, (d) -> d.value )])

    chart.attr("height", (@barHeight * data.length) + @marginTop)
    chart.attr("width", @width + @marginRight + @marginLeft)

    bar = chart.selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("transform", (d, i) => "translate(#{@marginLeft}, #{(i * @barHeight) + @marginTop})" )

    bar.append("rect")
      .attr("class", (d) -> d.color )
      .attr("width", (d) -> x(d.value) )
      .attr("height", @barHeight - 1)

    # Append value labels
    bar.append("text")
      .attr('class', 'value-label')
      .attr("x", @width + @marginRight)
      .attr("y", @barHeight / 2)
      .attr("dy", ".35em")
      .text((d) => @formatOutput(d.value) )

    # Append keys
    bar.append("text")
      .attr("x", -@marginLeft)
      .attr("y", @barHeight / 2)
      .attr("dy", ".35em")
      .text((d) => "##{d.id}" )

    @addLabel(chart, @label) if @label
