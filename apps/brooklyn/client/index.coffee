Backbone = require "backbone"
$ = require 'jquery'
Backbone.$ = $
moment = require 'moment'
nycTopoJson = require('../data/nyc-neighborhoods.json')
svgMapView = require('../../../components/svg-map/index.coffee')
lineGraph = require('../../../components/line-graph/index.coffee')
percentGraph = require('../../../components/line-graph/percent-graph.coffee')
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
salesData = require('../data/brooklyn-sales-display-data.json')
buildingClasses = require('../data/building-class.json')

module.exports.BrooklynView = class BrooklynView extends Backbone.View

  startingDataset: 'BK60'
  lineGraphs: []
  events:
    'click .tab' : 'tabClick'

  initialize: ->
    @$label = @$('.graph-heading')
    @renderSvgMap nycTopoJson
    @renderLineGraph()
    @renderBuildingClassGraphs()
    @reverseNeighborhoodHash()

    @svgMap.onClick({id: 'Clinton Hill'})

  tabClick: (event) ->
    $target = $(event.target)
    return if $target.hasClass('active')
    @$('.tab').removeClass 'active'
    $target.addClass 'active'
    @$('.sales-group').hide()
    @$(".#{$target.attr('data-class')}").show()

  handleHover: (date, dataset) =>
    data = for NTA in Object.keys(salesData)
      value = 0
      for item in salesData[NTA][dataset]
        if item.date == date
          value = item.value
      {
        id: neighborhoodNames[NTA]
        value: value
      }
    @svgMap.colorMap data

  validResidentialBuildingClasses: ["01", "02", "03", "07", "09", "10", "13", "15", "28"]
  validCommercialBuildingClasses: ["22","43", "21", "30", "27", "31", "32", "18", "29"]
  renderBuildingClassGraphs: ->
    width = 480
    height = 200
    filterResidentialDataset = (dataset) =>
      data = {}
      for buildingClass in @validResidentialBuildingClasses
        data[buildingClass] = dataset[buildingClass]
      data

    filterCommercialDataset = (dataset) =>
      data = {}
      for buildingClass in @validCommercialBuildingClasses
        data[buildingClass] = dataset[buildingClass]
      data

    @lineGraphs.push new percentGraph
      el: $('#brooklyn-residential-building-class')
      width: width
      height: height
      data: salesData
      startingDataset: @startingDataset
      keys: ['buildingClass']
      filterDataset: filterResidentialDataset
      label: 'Building Class'
      displayKey: (id) -> buildingClasses[id]

    # @lineGraphs.push new percentGraph
    #   el: $('#brooklyn-commercial-building-class')
    #   width: width
    #   height: height
    #   data: salesData
    #   startingDataset: @startingDataset
    #   keys: ['buildingClass']
    #   filterDataset: filterCommercialDataset
    #   label: 'Building Class'
    #   displayKey: (id) -> buildingClasses[id]

  renderLineGraph: ->
    width = 500
    height = 120
    @lineGraphs.push new lineGraph
      width: width
      height: height
      data: salesData
      startingDataset: @startingDataset
      keys: ['residentialSaleTally', 'residentialSaleTally-mean']
      el: $('#brooklyn-residential-tally')
      label: '# Sales'
      handleHover: @handleHover

    @lineGraphs.push new lineGraph
      width: width
      height: height
      data: salesData
      startingDataset: @startingDataset
      keys: ['residentialPriceAverage', 'residentialPriceAverage-mean']
      el: $('#brooklyn-residential-price-tally')
      label: 'Average Price Per SqFt'
      handleHover: @handleHover

    # @lineGraphs.push new lineGraph
    #   width: width
    #   height: height
    #   data: salesData
    #   startingDataset: @startingDataset
    #   keys: ['commercialSaleTally', 'commercialSaleTally-mean']
    #   el: $('#brooklyn-commercial-tally')
    #   label: '# Sales'
    #   handleHover: @handleHover

    # @lineGraphs.push new lineGraph
    #   width: width
    #   height: height
    #   data: salesData
    #   startingDataset: @startingDataset
    #   keys: ['commercialPriceAverage', 'commercialPriceAverage-mean']
    #   el: $('#brooklyn-commercial-price-tally')
    #   label: 'Average Price Per SqFt'
    #   handleHover: @handleHover

  renderSvgMap: (topojson) ->
    neighborhoods = []
    topojson.objects.nycneighborhoods.geometries = topojson.objects.nycneighborhoods.geometries.filter (neighborhood) ->
      neighborhood.id = neighborhood.id.split('-')[0]
      neighborhoods.push neighborhood.id
      unless neighborhood.id and neighborhood.properties.BoroCode == 3 and neighborhood.id != 'park'
        return false
      true

    @neighborhoods = neighborhoods

    @svgMap = new svgMapView
      el: $('#brooklyn-svg')
      topojson: topojson
      key: 'nycneighborhoods'
      ignoredId: 'park'
      customOnClick: (id) => @handleNeighborhoodClick(id)
      drawLabels: false
      zoomOnClick: false
      $colorKey: $('.brooklyn-svg-key')

  reverseNeighborhoodHash: ->
    @neighborhoodHash = {}
    @fullNeighborhoodHash = {}
    for key in Object.keys(neighborhoodNames)
      @neighborhoodHash[neighborhoodNames[key].split('-')[0]] = key
      @fullNeighborhoodHash[neighborhoodNames[key].split('-')[0]] = neighborhoodNames[key]

  handleNeighborhoodClick: (id) ->
    for lineGraph in @lineGraphs
      lineGraph.animateNewArea(@neighborhoodHash[id]) if lineGraph.$el.is(':visible')

    @$label.text @fullNeighborhoodHash[id].split('-').join(', ')

module.exports.init = ->
  new BrooklynView
    el: $ "body"
