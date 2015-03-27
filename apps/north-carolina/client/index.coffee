Backbone = require "backbone"
Backbone.$ = $
_ = require 'underscore'
svgMapView = require('./map.coffee')
topoJSON = require('../data/north-carolina-2012-districts.json')
spltlineTopoJSON = require('../data/shortest-splitline.json')
points = require('../data/display-data.json')
partyVote = require('../data/cpvi.json')
Router = require('../../../components/graph-key/router.coffee')
BarChart = require('./bar.coffee')
keyTemplate = require '../../../components/graph-key/linear-key.jade'
optionsTemplate = require('../templates/options.jade')

module.exports.NCView = class NCView extends Backbone.View

  # TODO Refactor mobile
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  scale: 2
  translateX: 280
  translateY: -100
  rotate: [80, 0]
  mapLabel: "% of the population"

  displayKeys:
    "white" : "White"
    "black" : "Black"
    "asian" : "Asian"
    "republican": "republican"
    "democrat": "democrat"
    # 'HS graduate': "Has a High-school degree"
    'bachelors': "with a Bachelor's degree"
    'farming': "who work in Farming"
    "children" : "with children under 18"
    "65" : "Over 65"
    "poverty" : "of Housholds Below the poverty line"
    "veteran" : "of Veterns"
    "employed" : "Employed"
    "unemployed" : "Unemployed"
    "armed" : "In the Armed Forces"

  initialize: ->
    @isMobile = @$el.width() < 500

    @reverseColorKey = true
    @$colorKey = @$('.north-carolina-svg-key')
    @colorKeyWidth = 100

    @renderSvgMap topoJSON, @$('#three-svg')
    @renderPoints()

    @stateTotals = @getStateTotals()
    @areaTotals = @getAreaTotals()

    @renderAreaGraphs @$('.graph-section .svg-container')

    @renderFilterOptions()

    @router = new Router
      graphs: []
      map: { handleNeighborhoodSelect: @handleNeighborhoodSelect }
      handleSelect: @handleSelectChange
      handleOverview: =>

    Backbone.history.start
      root: '/north-carolina'
      pushState: true

   # Input must be sorted in ascending order
  getColorClass: (min, max) ->
    d3.scale.quantile()
      .domain([min, max])
      .range(d3.range(11).map((i) -> "color#{i}" ))

  getPartyVoteValue: (area) ->
    value = partyVote[area].split('+')[1]
    if partyVote[area].split('+')[0] == 'd'
      value = - value
    value

  renderAreaGraphs: ($el) ->
    quantize = @getColorClass -25, 25

    for key in Object.keys(@displayKeys)
      id = "graph-#{key}"
      $el.append "<svg id=#{id}></svg>"
      data =
        for area in [1..13]
          {
            id: area
            value: @areaTotals[area][key]
            color: quantize(@getPartyVoteValue(area))
          }

      new BarChart
        el: $("##{id}")
        data: data
        label: "Number of #{@displayKeys[key]}"

    @drawAreaGraphsKey @$('.north-carolina-stats-svg-key')

  drawAreaGraphsKey: ($el) ->
    classes = for num in [0..10]
      "color#{num}"

    values = for num in [0..10]
      if num < 1
        "More Democrat"
      else if num > 9
        "More Republican"

    $el.after(keyTemplate(width: 25, classes: classes, values: values, margin: { left: 0}))

  events:
    "click .option" : "optionClick"
    "click .map-type" : "mapTypeClick"

  optionClick: (event) ->
    $target = $(event.target)
    val = $target.attr('data-id')
    @handleSelectChange val
    false

  mapTypeClick: (event) ->
    @$(".map-type").removeClass 'active'
    $(event.target).addClass 'active'

    Backbone.history.navigate($(event.target).attr('href').replace('/north-carolina', ''), trigger: true)
    false

  renderFilterOptions: ->
    @$('.options-container').html optionsTemplate(keys: @displayKeys)

  handleSelectChange: (val) =>
    @$(".options-container .option").removeClass 'active'
    @$(".options-container .option[data-id=#{val}]").addClass 'active'

    @colorMap val

  formatMapHoverText: (hoveredItem, value=-1) =>
    "District ##{hoveredItem.id}"

  handleGraphHover: (arg) ->
    console.log 'hello', arg

  getMapColorHash: (key) ->
    items = for item in points
      {
        id: item.id
        value: item[key]
      }
    items.sort((x, y) -> x.value - y.value)

  colorMap: (key) =>
    label = @mapLabel
    data = @getMapColorHash key
    @svgMap.activeId = false
    @svgMap.colorMap data, 0, 100, label, 'circle'
    @svgMap.updateMapTitle "#{label} #{key}"

  renderPoints: ->
    projection = d3.geo.mercator().rotate @rotate
    path = d3.geo.path().projection(projection)

    @svgMap.svg.selectAll('circle')
      .data(points)
      .enter().append('circle')
      .attr("d", path)
      .attr('class', 'circle')
      .attr('cx', (d) => @svgMap.projection(d.point)[0])
      .attr('cy', (d) => @svgMap.projection(d.point)[1])
      .attr('r', 2)

  renderSvgMap: (topojson, $el) ->
    throttledGraphHover = _.throttle @handleGraphHover, 300

    @svgMap = new svgMapView
      el: $el
      mapLabel: @mapLabel
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
      $colorKey: @$colorKey
      reverseColorKey: false

  getStateTotals: ->
    keys = Object.keys(@displayKeys)
    totals = {}

    for key in keys
      totals[key] = 0

    for item in points
      for key in keys
        totals[key] += item[key]

    totals

  getAreaTotals: ->
    areas = [1..13]
    totals = {}

    for area in areas
      totals[area] = @getTotalsForArea area

    totals

  getTotalsForArea: (area) ->
    keys = Object.keys(@displayKeys)
    totals = {}

    for key in keys
      totals[key] = 0

    for item in points
      if item.district == String(area)
        for key in keys
          totals[key] += item[key]

    totals

  areaHash:
    'official-2012': topoJSON
    'splitline': spltlineTopoJSON

  handleNeighborhoodSelect: (area, hoverArea) =>
    console.log area, hoverArea
    if area != @svgMap.mapType
      @svgMap.mapType = area
      @svgMap.drawMap @areaHash[area]


module.exports.init = ->
  new NCView
    el: $ "body"
