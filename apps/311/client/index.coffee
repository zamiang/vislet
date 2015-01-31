Backbone = require "backbone"
Backbone.$ = $
moment = require 'moment'
LineGraph = require('../../../components/line-graph/index.coffee')
PercentGraph = require('../../../components/line-graph/percent-graph.coffee')
StackedGraph = require('../../../components/area-chart/index.coffee')
MapViewBase = require('../../../components/svg-map/base.coffee')
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
threeData = require('../data/display-data.json')
Slider = require('../../../components/slider/index.coffee')
topoJSON = require('../data/nyc.json')
complaintTypes = require('../data/complaint-types.json')

module.exports.ThreeView = class ThreeView extends Backbone.View

  startingDataset: 'BK60'

  # TODO Refactor
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderMap()
    @renderLineGraph()
    @renderStackedGraphs()

  renderMap: ->
    formatNeighborhoodName = (name) -> name?.split('-').join(', ')

    for NTA in Object.keys(neighborhoodNames)
      neighborhoodNames[NTA] = formatNeighborhoodName neighborhoodNames[NTA]

    mapview = new MapViewBase
      el: @$el
      isMobile: @isMobile
      mapLabel: ""
      dateFormat: "[Number of 311 Reports per 1,000 residents in] MMMM, YYYY"
      dataset: "complaintTally"
      translateX: -120
      translateY: 60
      scale: 1.67
      $colorKey: $('.three-svg-key')
      $map: $('#three-svg')
      data: threeData
      topoJSON: topoJSON
      neighborhoodNames: neighborhoodNames
      ignoredIds: ['99', '98']
      rotate: [74 + 700 / 60, -38 - 50 / 60]
      mapColorMax: 50

    mapview.on 'hover', (params) =>
      @lineGraph.animateNewArea(params.currentNTA, params.hoverNTA)
    mapview.on 'click', (params) =>
      @lineGraph.animateNewArea(params.id)
      @stackedGraph.animateNewArea(params.id)
      @stackedGraph.changeLabel "311 reports over the course of a day in #{neighborhoodNames[params.id]}"

  renderStackedGraphs: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(460)
    height = 230

    types = {}
    for type in Object.keys(complaintTypes)
      types[complaintTypes[type]] = type

    @stackedGraph = new StackedGraph
      el: $('#three-complaint-type')
      width: width
      height: height
      data: threeData
      startingDataset: @startingDataset
      keys: ['complaintType']
      label: ' '
      displayKey: (id) -> types[id]
      colorSet: d3.scale.category20c
      yAxisFormat: (x) -> x
      computeYDomain: true

  renderLineGraph: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(620)
    height = 230

    @lineGraph = new LineGraph
      width: width
      height: height
      data: threeData
      startingDataset: @startingDataset
      keys: ['complaintTally', 'complaintTally-mean']
      el: $('#three-complaint-tally')
      label: 'Avg Number of 311 complaints per 1,000 residents'
      handleHover: @handleHover

module.exports.init = ->
  new ThreeView
    el: $ "body"
