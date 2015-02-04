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

module.exports.ChicagoView = class ChicagoView extends Backbone.View

  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width
  startingDataset: 'MorPar' #'Englewood'

  formatCrimeTypes: ->
    names = {}
    for name in Object.keys(crimeTypes)
      names[crimeTypes[name]] = name
    names

  initialize: ->
    @isMobile = @$el.width() < 500
    @crimeTypes = @formatCrimeTypes()
    @renderMap()
    @renderStackedGraph()
    @renderLineGraph()
    @renderSelectBox()

  renderSelectBox: ->
    @types = {}
    for key in Object.keys(crimeTypes)
      @types[crimeTypes[key]] = key

    html = "<option value='ALL'>ALL</option>"
    html +=
      (for key in Object.keys(crimeData["ALL"]["crimeType"])
        "<option value='#{key}'>#{@types[key]}</option>"
      ).join ''

    @$('#crime-select')
      .html(html)
      .on 'change', => @handleSelectChange()

  handleSelectChange: (event) ->
    val = @$('#crime-select').val()
    if val == "ALL"
      @selectData = false
      @mapview.showHideSlider true
      @mapview.colorMap @mapview.slider.getValue(), 0, @mapColorMax, @mapLabel
      return

    @mapview.showHideSlider false

    @selectData = []
    @selectHash = {}
    for NTA in Object.keys(crimeData)
      unless NTA == "ALL"
        rawData = crimeData[NTA]["crimeType"][val]
        values =
          for key in Object.keys(rawData)
            rawData[key].value

        value = d3.sum(values)
        @selectHash[NTA] = value
        @selectData.push({ id: NTA, value: value })

    max = d3.max(@selectData, (item) -> item.value)
    @mapview.svgMap.colorMap @selectData, 0, max, @mapLabel, true
    @mapview.svgMap.updateMapTitle "#{@types[val]} Reports"


  renderMap: ->
    # Reformat both the neighborhood names hash and the topoJSON
    # neighborhood names should be id: fullname
    # topojson shapes should have the id of the id in the neighborhoodNames hash
    neighborhoods = {}
    for name in Object.keys(neighborhoodNames)
      neighborhoods[neighborhoodNames[name]] = name

    for item in topoJSON.objects.neighborhoods.geometries
      item.id = neighborhoodNames[item.id]

    mapview = @mapview = new MapViewBase
      el: @$el
      isMobile: @isMobile
      dateFormat: "MMM, YYYY"
      dataset: "crimeTally"
      scale: 0.93
      translateX: 3
      translateY: 0
      $colorKey: $('.chicago-svg-key')
      $map: $('#chicago-svg')
      rotate: [74 + 800 / 60, -38 - 50 / 60]
      data: crimeData
      topoJSON: topoJSON
      ignoredIds: []
      neighborhoodNames: neighborhoods

    mapview.on 'hover', (params) =>
      unless mapview.isCholoropleth
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
      displayKey: (id) => @crimeTypes[id]

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
      label: 'Number of Crimes'
      handleHover: @handleHover

module.exports.init = ->
  new ChicagoView
    el: $ "body"
