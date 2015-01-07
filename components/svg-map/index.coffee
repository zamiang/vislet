d3 = require 'd3'
_ = require 'underscore'
topojson = require 'topojson'
Backbone = require "backbone"
Color = require './color.coffee'
{ uniqueId } = require 'underscore'

module.exports = class SvgMap extends Backbone.View
  _.extend @prototype, Color

  margin:
    top: 0
    right: 0
    bottom: 0
    left: 0

  initialize: (options) ->
    { @zoomOnClick, @key, @topojson, @ignoredId, @customOnClick, @$colorKey } = options
    @width = @$el.width()
    @height = @$el.height()
    @render()

  render: ->
    neighborhoods = topojson.feature(@topojson, @topojson.objects[@key])

    projection = d3.geo.transverseMercator()
      .rotate([74 + 700 / 60, -38 - 50 / 60])

    path = d3.geo.path().projection(projection)

    svg = d3.select "##{@$el.attr('id')}"

    projection.scale(1).translate([0, 0])

    bounds = path.bounds(neighborhoods)
    scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / @width, (bounds[1][1] - bounds[0][1]) / @height)
    translate = [(@width - scale * (bounds[1][0] + bounds[0][0])) / 2, (@height - scale * (bounds[1][1] + bounds[0][1])) / 2]

    projection.scale(scale).translate(translate)

    g = svg.append("g")
    g.selectAll("path")
      .data(neighborhoods.features)
      .enter().append("path")
      .attr("class", (d) => if d.id == @ignoredId then 'park' else 'tract' )
      .attr("data-id", (d) -> d.id )
      .attr("d", path)
      .on("click", (item) => @onClick(item, path, g) )
      .append("title")

    @drawLabels(g, neighborhoods, path) if @shouldLabel

  onClick: (item, path, g) ->
    if item.id == @activeId
      return @reset d3.select('data-id', item.id), g
    else
      @activeId = item.id

    @customOnClick item.id

    @$(".tract").attr('class', 'tract')
    @$(".tract[data-id='#{item.id}']").attr('class', 'tract selected')
    @$colorKey?.find('.key-bar-values').hide()

    if @zoomOnClick
      bounds = path.bounds(item)
      dx = bounds[1][0] - bounds[0][0]
      dy = bounds[1][1] - bounds[0][1]
      x = (bounds[0][0] + bounds[1][0]) / 2
      y = (bounds[0][1] + bounds[1][1]) / 2
      scale = .9 / Math.max(dx / @width, dy / @height)
      translate = [@width / 2 - scale * x, @height / 2 - scale * y]

      g.transition()
        .duration(550)
        .style("stroke-width", "#{1.5 / scale}px")
        .attr("transform", "translate(#{translate})scale(#{scale})")

  reset: (active, g) ->
    @$('.tract.selected').attr('class', 'tract')
    active = d3.select(null)

    g.transition().duration(750).style("stroke-width", "1px").attr("transform", "")

  drawLabels: (svg, neighborhoods, path) ->
    svg.selectAll(".subunit-label")
      .data(neighborhoods.features.filter((d) -> return (d.id / 10000 | 0) % 100 != 99 ))
      .enter().append("text")
      .attr("class", (d) -> "subunit-label #{d.id}" )
      .attr("transform", (d) -> "translate(#{path.centroid(d)})" )
      .attr("dy", ".35em")
      .text((d) -> return d.id )
