Backbone = require "backbone"
Backbone.$ = $
_ = require 'underscore'
moment = require 'moment'
svgMapView = require('../../../components/svg-map/index.coffee')
topoJSON = require('../data/north-carolina-2012-districts.json')
points = require('../data/display-data.json')

module.exports.NCView = class NCView extends Backbone.View

  # TODO Refactor mobile
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  scale: 2
  translateX: 280
  translateY: -100
  rotate: [80, 0]

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderSvgMap topoJSON, @$('#three-svg')
    @renderPoints()

  formatMapHoverText: (hoveredItem, value=-1) =>
    "District ##{hoveredItem.id}"

  handleGraphHover: (arg) ->
    console.log 'hello', arg

  renderPoints: ->
    projection = d3.geo.mercator().rotate @rotate
    path = d3.geo.path().projection(projection)

    @svgMap.svg.append('svg:circle')
      .data(points)
      .attr("d", path)
      .attr('x', (d) -> d.x)
      .attr('y', (d) -> d.y)
      .attr('r', 5)

  renderSvgMap: (topojson, $el) ->
    throttledGraphHover = _.throttle @handleGraphHover, 300

    @svgMap = new svgMapView
      el: $el
      topojson: topojson
      key: 'districts'
      drawLabels: false
      zoomOnClick: false
      ignoredIds: false
      scale: @scale
      translateX: @translateX
      translateY: @translateY
      customMouseEnter: throttledGraphHover
      height: if @isMobile then 400 else 600
      width: if @isMobile then 340 else 500
      formatHoverText: @formatMapHoverText
      rotate: @rotate

module.exports.init = ->
  new NCView
    el: $ "body"
