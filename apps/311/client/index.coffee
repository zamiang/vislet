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
Select = require('../../../components/select/index.coffee')
complaintTypes = require('../data/complaint-types.json')
formatNeighborhoodName = require('../../../components/datautil/format-name.coffee')
Router = require('../../../components/graph-key/router.coffee')

module.exports.ThreeView = class ThreeView extends Backbone.View

  # TODO Refactor mobile
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  ignoredIds: ['99', '98']
  mapLabel: "311 Reports per 1,000 residents"
  startingDataset: 'BK60'
  mapColorMax: 50

  initialize: ->
    @isMobile = @$el.width() < 500
    @complaintTypesHash = {}
    for type in Object.keys(complaintTypes)
      @complaintTypesHash[complaintTypes[type]] = type

    @renderMap()
    @renderLineGraph()
    @renderStackedGraphs()
    @renderSelectBox()
    @router = new Router
      graphs: [@lineGraph, @stackedGraph]
      map: @mapview
      handleSelect: @handleSelectChange

    Backbone.history.start({
      root: '/311',
      pushState: true
    })

  renderSelectBox: ->
    data = {}
    for key in Object.keys(threeData["ALL"]["complaintType"])
      data[key] = @complaintTypesHash[key]

    selectBox = new Select
      el: $('#three-select')
      data: data

  handleSelectChange: (val) =>
    if val == "ALL"
      @mapview.mapHoverHash = false
      @mapview.showHideSlider true
      @mapview.colorMap @mapview.slider.getValue(), 0, @mapColorMax, @mapLabel
      return

    @mapview.showHideSlider false

    selectData = []
    selectHash = {}
    for NTA in Object.keys(threeData)
      unless NTA == "ALL" or @isIgnored(NTA)
        rawData = threeData[NTA]["complaintType"][val]
        values =
          for key in Object.keys(rawData)
            rawData[key].value

        value = d3.sum(values)
        selectHash[NTA] = value
        selectData.push({ id: NTA, value: value })

    max = d3.max(selectData, (item) -> item.value)
    @mapview.mapHoverHash = selectHash
    @mapview.svgMap.colorMap selectData, 0, max, @mapLabel, true
    @mapview.svgMap.updateMapTitle "#{@complaintTypesHash[val]} Reports per 1,000 residents"

  isIgnored: (id) ->
    for ignoredId in @ignoredIds
      if id.indexOf(ignoredId) > -1
        return true
    false

  renderMap: ->
    for NTA in Object.keys(neighborhoodNames)
      neighborhoodNames[NTA] = formatNeighborhoodName neighborhoodNames[NTA]

    mapview = @mapview = new MapViewBase
      el: @$el
      isMobile: @isMobile
      mapLabel: @mapLabel
      ignoredIds: @ignoredIds
      mapColorMax: @mapColorMax
      $colorKey: $('.three-svg-key')
      $map: $('#three-svg')
      $select: $('.select-container')
      dateFormat: "MMMM, YYYY"
      dataset: "complaintTally"
      scale: 1.3
      translateX: -50
      translateY: 20
      data: threeData
      topoJSON: topoJSON
      neighborhoodNames: neighborhoodNames
      rotate: [74 + 700 / 50, -38 - 50 / 60]

    mapview.on 'hover', (params) =>
      if @mapview.isCholoropleth and @selectData
        @mapview.updateMapHoverText({id: params.hoverNTA}, @selectHash[params.hoverNTA])
      else
        @lineGraph.animateNewArea(params.currentNTA, params.hoverNTA)

  renderStackedGraphs: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(460)
    height = 230

    @stackedGraph = new StackedGraph
      el: $('#three-complaint-type')
      width: width
      height: height
      data: threeData
      startingDataset: @startingDataset
      keys: ['complaintType']
      label: "#{@mapLabel} per hour"
      displayKey: (id) => @complaintTypesHash[id]
      colorSet: d3.scale.category20c
      yAxisFormat: (x) -> x
      computeYDomain: true
      ignoredIds: ['rode', 'heat']
      tooltipFormat: ""

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
      label: "#{@mapLabel} per month"
      handleHover: @handleHover

module.exports.init = ->
  new ThreeView
    el: $ "body"
