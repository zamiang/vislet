d3 = require 'd3'
_ = require 'underscore'
topojson = require 'topojson'
Backbone = require "backbone"
Color = require './color.coffee'
Mouse = require './mouse.coffee'
hoverintent = require 'hoverintent'
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
    ignoredIds: null
    title: ''
    speed: 500
    scale: 0.95
    translateX: 0
    translateY: 0
    reverseColorKey: true
    rotate: [74 + 700 / 60, -38 - 50 / 60]

  initialize: (options) ->
    { @zoomOnClick, @key, @topojson, @ignoredIds, @customOnClick, @customMouseLeave, @customClickSelectedArea, @reverseColorKey, @width, @height, @formatHoverText, @rotate
      @colorKeyWidth, @customMouseEnter, @$colorKey, @title, @scale, @translateX, @translateY } = _.defaults(options, @defaults)
    @render()

  render: ->
    neighborhoods = topojson.feature(@topojson, @topojson.objects[@key])

    projection = d3.geo.transverseMercator().rotate @rotate

    path = d3.geo.path().projection(projection)

    svg = @svg = d3.select "##{@$el.attr('id')}"

    projection.scale(1).translate([0, 0])

    bounds = path.bounds(neighborhoods)
    scale = @scale / Math.max((bounds[1][0] - bounds[0][0]) / @width, (bounds[1][1] - bounds[0][1]) / @height)
    translate = [((@width - scale * (bounds[1][0] + bounds[0][0])) / 2) + @translateX, ((@height - scale * (bounds[1][1] + bounds[0][1])) / 2) + @translateY]

    projection.scale(scale).translate(translate)

    g = svg.append("g")
    g.selectAll("path")
      .data(neighborhoods.features)
      .enter().append("path")
      .attr("class", @getShapeClass)
      .attr("data-id", (d) -> d.id )
      .attr("d", path)
      .on("click", (d) => if d.id != @ignoredId then @onClick(d, path, g) )
      .append("title")

    @setupMouseEvents()
    @drawLabels(g, neighborhoods, path) if @shouldLabel
    @addHoverText(g) if @formatHoverText
    @addMapTitle g, @label

  getShapeClass: (d) =>
    cls = 'tract'
    if @ignoredIds
      for id in @ignoredIds
        if d.id.indexOf(id) > -1
          cls = 'park'
    cls

  setupMouseEvents: ->
    @svg.on 'mouseleave', => @mouseleave()

    hover = (item) => @mouseover(item)
    options =
      sensitivity: 5

    for $item in @$('.tract')
      hoverintent(
        $item
        -> hover(d3.select(@).data()[0])
        ->
      ).options(options)

  addMapTitle: (g, label) ->
    @label = g.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr('class', 'label-text')
      .text(label)

  addHoverText: (g) ->
    @hoverText = g.append("text")
      .attr("x", 10)
      .attr("y", 40)
      .attr('class', 'hover-text')

  updateMapTitle: (label) -> @label.text(label)

  drawLabels: (svg, neighborhoods, path) ->
    svg.selectAll(".subunit-label")
      .data(neighborhoods.features.filter((d) -> (d.id / 10000 | 0) % 100 != 99 ))
      .enter().append("text")
      .attr("class", (d) -> "subunit-label #{d.id}" )
      .attr("transform", (d) -> "translate(#{path.centroid(d)})" )
      .attr("dy", ".35em")
      .text((d) -> d.id )
