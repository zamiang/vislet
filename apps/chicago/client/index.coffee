d3 = require 'd3'
Backbone = require "backbone"
Backbone.$ = $
_ = require 'underscore'
svgMapView = require('../../../components/svg-map/index.coffee')
LineGraph = require('../../../components/line-graph/index.coffee')
StackedGraph = require('../../../components/area-chart/index.coffee')
MapViewBase = require('../../../components/svg-map/base.coffee')
crimeData = require '../data/chicago-crimes-display-data.json'
crimeTypes = require '../data/crime-types.json'
topoJSON = require('../data/neighborhoods.json')
neighborhoodNames = require('../data/neighborhood-names.json')
Router = require('../../../components/graph-key/router.coffee')
Select = require('../../../components/select/index.coffee')

module.exports.ChicagoView = class ChicagoView extends Backbone.View

  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  startingDataset: '68'
  mapLabel: "Number of Crimes per 1,000 resident"
  mapColorMax: 40
  ignoredIds: ['33', '20']

  formatCrimeTypes: ->
    names = {}
    for name in Object.keys(crimeTypes)
      names[crimeTypes[name]] = name
    names

  initialize: ->
    @isMobile = @$el.width() < 500
    @crimeTypes = @formatCrimeTypes()
    @neighborhoods = {}
    for name in Object.keys(neighborhoodNames)
      @neighborhoods[neighborhoodNames[name]] = name
    @renderMap()
    @renderStackedGraph()
    @renderLineGraph()
    @renderSelectBox()

    @router = new Router
      graphs: [@lineGraph, @stackedGraph]
      map: @mapview
      handleSelect: @handleSelectChange

    Backbone.history.start({
      root: '/chicago',
      pushState: true,
      silent: false
    })

  isIgnored: (id) ->
    for ignoredId in @ignoredIds
      if id.indexOf(ignoredId) > -1
        return true
    false

  renderSelectBox: ->
    @types = {}
    for key in Object.keys(crimeData["ALL"]["crimeType"])
      @types[key] = @crimeTypes[key]

    selectBox = new Select
      el: $('#crime-select')
      data: @types

  handleSelectChange: (val) =>
    if val == "ALL"
      @selectData = false
      @mapview.showHideSlider true
      @mapview.colorMap @mapview.slider.getValue(), 0, @mapColorMax, @mapLabel
      return

    @mapview.showHideSlider false

    @selectData = []
    @selectHash = {}
    for NTA in Object.keys(crimeData)
      unless NTA == "ALL" or @isIgnored(NTA)
        rawData = crimeData[NTA]["crimeType"][val]
        values =
          for key in Object.keys(rawData)
            rawData[key].value

        value = d3.sum(values)
        @selectHash[NTA] = value
        @selectData.push({ id: NTA, value: value })

    max = d3.max(@selectData, (item) -> item.value)
    @mapview.svgMap.colorMap @selectData, 0, max, @mapLabel, true
    @mapview.svgMap.updateMapTitle "#{@types[val]} per 1,000 residents"

  renderMap: ->
    mapview = @mapview = new MapViewBase
      el: @$el
      isMobile: @isMobile
      dateFormat: "MMMM, YYYY"
      dataset: "crimeTally"
      scale: 0.93
      translateX: 3
      translateY: 0
      $colorKey: $('.chicago-svg-key')
      $map: $('#chicago-svg')
      $select: $('.select-container')
      rotate: [74 + 800 / 60, -38 - 50 / 60]
      data: crimeData
      topoJSON: topoJSON
      ignoredIds: []
      neighborhoodNames: neighborhoodNames
      ignoredIds: @ignoredIds
      mapLabel: @mapLabel
      mapColorMax: @mapColorMax

    mapview.on 'hover', (params) =>
      if @mapview.isCholoropleth and @selectData
        @mapview.updateMapHoverText({id: params.hoverNTA}, @selectHash[params.hoverNTA])
      else
        @lineGraph.animateNewArea(params.currentNTA, params.hoverNTA)

    mapview.on 'click', (params) =>
      @lineGraph.animateNewArea(params.id)
      @stackedGraph.animateNewArea(params.id)
      @stackedGraph.changeLabel "Crimes per 1,000 residents per hour in #{neighborhoodNames[params.id]}"

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
      label: 'Crimes per 1,000 residents per hour'
      displayKey: (id) => @crimeTypes[id]
      colorSet: d3.scale.category20c
      yAxisFormat: (x) -> x
      ignoredIds: ['RIT', 'heat']
      computeYDomain: true
      tooltipFormat: ""

  renderLineGraph: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(620)
    height = 230

    @lineGraph = new LineGraph
      width: width
      height: height
      data: crimeData
      startingDataset: @startingDataset
      keys: ['crimeTally', 'crimeTally-mean']
      el: $('#chicago-crime-tally')
      label: 'Number of Crimes per 1,000 residents per month'
      handleHover: @handleHover

module.exports.init = ->
  new ChicagoView
    el: $ "body"
