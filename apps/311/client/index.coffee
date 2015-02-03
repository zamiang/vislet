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
  ignoredIds: ['99', '98']
  mapLabel: "311 Reports per 1,000 residents"
  mapColorMax: 50

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderMap()
    @renderLineGraph()
    @renderStackedGraphs()
    @renderSelectBox()

  renderSelectBox: ->
    html = "<option value='ALL'>ALL</option>"
    html +=
      (for key in Object.keys(threeData["ALL"]["complaintType"])
        "<option value='#{key}'>#{@types[key]}</option>"
      ).join ''
    @$('#three-select')
      .html(html)
      .on 'change', => @handleSelectChange()

  handleSelectChange: (event) ->
    val = @$('#three-select').val()
    if val == "ALL"
      @selectData = false
      @mapview.showHideSlider true
      @mapview.colorMap @mapview.slider.getValue(), 0, @mapColorMax, @mapLabel
      return

    @mapview.showHideSlider false

    @selectData = []
    @selectHash = {}
    for NTA in Object.keys(threeData)
      unless NTA == "ALL" or @isIgnored(NTA)
        rawData = threeData[NTA]["complaintType"][val]
        values =
          for key in Object.keys(rawData)
            rawData[key].value

        value = d3.sum(values)
        @selectHash[NTA] = value
        @selectData.push({ id: NTA, value: value })

    max = d3.max(@selectData, (item) -> item.value)
    @mapview.svgMap.colorMap @selectData, 0, max, @mapLabel, true
    @mapview.svgMap.updateMapTitle "#{@types[val]} Reports per 1,000 residents"

  isIgnored: (id) ->
    for ignoredId in @ignoredIds
      if id.indexOf(ignoredId) > -1
        return true
    false

  renderMap: ->
    formatNeighborhoodName = (name) -> name?.split('-').join(', ')

    for NTA in Object.keys(neighborhoodNames)
      neighborhoodNames[NTA] = formatNeighborhoodName neighborhoodNames[NTA]

    mapview = @mapview = new MapViewBase
      el: @$el
      isMobile: @isMobile
      mapLabel: @mapLabel
      dateFormat: "MMMM, YYYY"
      dataset: "complaintTally"
      scale: 1.3
      translateX: -50
      translateY: 20
      $colorKey: $('.three-svg-key')
      $map: $('#three-svg')
      $select: $('.select-container')
      data: threeData
      topoJSON: topoJSON
      neighborhoodNames: neighborhoodNames
      ignoredIds: @ignoredIds
      rotate: [74 + 700 / 50, -38 - 50 / 60]
      mapColorMax: @mapColorMax

    mapview.on 'hover', (params) =>
      if @mapview.isCholoropleth and @selectData
        @mapview.updateMapHoverText({id: params.hoverNTA}, @selectHash[params.hoverNTA])
      else
        @lineGraph.animateNewArea(params.currentNTA, params.hoverNTA)

    mapview.on 'click', (params) =>
      @lineGraph.animateNewArea(params.id)
      @stackedGraph.animateNewArea(params.id)
      @stackedGraph.changeLabel "311 reports per 1,000 residents per hour in #{neighborhoodNames[params.id]}"

  renderStackedGraphs: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(460)
    height = 230

    types = {}
    for type in Object.keys(complaintTypes)
      types[complaintTypes[type]] = type

    @types = types

    @stackedGraph = new StackedGraph
      el: $('#three-complaint-type')
      width: width
      height: height
      data: threeData
      startingDataset: @startingDataset
      keys: ['complaintType']
      label: '311 reports per 1,000 residents per hour'
      displayKey: (id) -> types[id]
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
      label: 'Number of 311 reports per 1,000 residents per month'
      handleHover: @handleHover

module.exports.init = ->
  new ThreeView
    el: $ "body"
