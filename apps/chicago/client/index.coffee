Backbone = require "backbone"
Backbone.$ = $
_ = require 'underscore'
svgMapView = require('../../../components/svg-map/index.coffee')
LineGraph = require('../../../components/line-graph/index.coffee')
StackedGraph = require('../../../components/area-chart/index.coffee')
MapView = require('./map.coffee')
crimeData = require '../data/chicago-crimes-display-data.json'

module.exports.ChicagoView = class ChicagoView extends Backbone.View

  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width
  startingDataset: 'Englewood'

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderMap()
    @renderStackedGraph()
    @renderLineGraph()

  renderMap: ->
    mapview = new MapView
      el: @$el
      isMobile: @isMobile

    mapview.on 'hover', (params) =>
      @lineGraph.animateNewArea(params.currentNTA, params.hoverNTA)
    mapview.on 'click', (params) =>
      @lineGraph.animateNewArea(params.id)
      @stackedGraph.animateNewArea(params.id)

  renderStackedGraph: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(460)
    height = 230

    @stackedGraph = new StackedGraph
      el: $('#chicago-crime-type')
      width: width
      height: height
      data: crimeData
      startingDataset: @startingDataset
      keys: ['crimeType']
      label: 'Type of Crimes as % of total'
      displayKey: (id) -> id

  renderLineGraph: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(620)
    height = 230

    @lineGraph = new LineGraph
      width: width
      height: height
      data: crimeData
      startingDataset: @startingDataset
      keys: ['crimeTally']
      el: $('#chicago-crime-tally')
      label: 'Number of Crimess'
      yAxisFormat: (x) -> "$#{x}"
      handleHover: @handleHover

    # recoveryGraph.animateNewArea('BK69', 'BK50')

module.exports.init = ->
  new ChicagoView
    el: $ "body"
