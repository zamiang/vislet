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
    scale: 0.95
    translateX: 0
    translateY: 0
    reverseColorKey: true

  initialize: (options) ->
    { @zoomOnClick, @key, @topojson, @ignoredId, @customOnClick, @customMouseLeave, @customClickSelectedArea, @reverseColorKey
      @colorKeyWidth, @customMouseEnter, @$colorKey, @title, @scale, @translateX, @translateY } = _.defaults(options, @defaults)
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
    scale = 1.05 / Math.max((bounds[1][0] - bounds[0][0]) / @width, (bounds[1][1] - bounds[0][1]) / @height)
    translate = [((@width - scale * (bounds[1][0] + bounds[0][0])) / 2) + @translateX, ((@height - scale * (bounds[1][1] + bounds[0][1])) / 2) + @translateY]

    projection.scale(scale).translate(translate)

    g = svg.append("g")
    g.selectAll("path")
      .data(neighborhoods.features)
      .enter().append("path")
      .attr("class", (d) => if d.id == @ignoredId then 'park' else 'tract' )
      .attr("data-id", (d) -> d.id )
      .attr("d", path)
      .on("click", (d) => if d.id != @ignoredId then @onClick(d, path, g) )
      .on("mouseover", (d) => if d.id != @ignoredId then @mouseover(d) )
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

  updateMapTitle: (label) -> @label.text(label)

  drawLabels: (svg, neighborhoods, path) ->
    svg.selectAll(".subunit-label")
      .data(neighborhoods.features.filter((d) -> return (d.id / 10000 | 0) % 100 != 99 ))
      .enter().append("text")
      .attr("class", (d) -> "subunit-label #{d.id}" )
      .attr("transform", (d) -> "translate(#{path.centroid(d)})" )
      .attr("dy", ".35em")
      .text((d) -> d.id )
