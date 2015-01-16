Backbone = require "backbone"
Backbone.$ = $
_ = require 'underscore'
svgMapView = require('../../../components/svg-map/index.coffee')
LineGraph = require('../../../components/line-graph/index.coffee')
StackedGraph = require('../../../components/area-chart/index.coffee')
Slider = require('../../../components/slider/index.coffee')
MapView = require('./map.coffee')

module.exports.ChicagoView = class ChicagoView extends Backbone.View

  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderMap()

  renderMap: ->
    mapview = new MapView
      el: @$el
      isMobile: @isMobile

    mapview.on 'hover', (params) =>
      # TODO
    mapview.on 'click', (params) =>
      # TODO

module.exports.init = ->
  new ChicagoView
    el: $ "body"
