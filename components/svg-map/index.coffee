d3 = require 'd3'
_ = require 'underscore'
topojson = require 'topojson'
Backbone = require "backbone"
Color = require './color.coffee'
Mouse = require './mouse.coffee'
{ uniqueId } = require 'underscore'

module.exports = class SvgMap extends Backbone.View
  _.extend @prototype, Color
  _.extend @prototype, Mouse

  margin:
    top: 0
    right: 0
    bottom: 0
    left: 0

  defaults:
    zoomOnClick: true
    ignoredId: null
    title: ''
    speed: 500

  initialize: (options) ->
    { @zoomOnClick, @key, @topojson, @ignoredId, @customOnClick, @customMouseLeave
      @customMouseEnter, @$colorKey, @title } = _.defaults(options, @defaults)
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
      .on("mouseover", (item) => @mouseover(item) )
      .append("title")

    svg.on 'mouseleave', => @mouseleave()

    @drawLabels(g, neighborhoods, path) if @shouldLabel
    @addMapTitle g, @label

  addMapTitle: (g, label) ->
    @label = g.append("text")
      .attr("x", @width - 20)
      .attr("y", 30)
      .style("text-anchor", "end")
      .attr('class', 'label-text')
      .text(label)

  updateMapTitle: (label) ->
    @label.text(label)

  drawLabels: (svg, neighborhoods, path) ->
    svg.selectAll(".subunit-label")
      .data(neighborhoods.features.filter((d) -> return (d.id / 10000 | 0) % 100 != 99 ))
      .enter().append("text")
      .attr("class", (d) -> "subunit-label #{d.id}" )
      .attr("transform", (d) -> "translate(#{path.centroid(d)})" )
      .attr("dy", ".35em")
      .text((d) -> d.id )
