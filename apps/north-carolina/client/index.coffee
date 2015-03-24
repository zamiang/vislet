Backbone = require "backbone"
Backbone.$ = $
_ = require 'underscore'
moment = require 'moment'
svgMapView = require('../../../components/svg-map/index.coffee')
Select = require('../../../components/select/index.coffee')
topoJSON = require('../data/north-carolina-2012-districts.json')
points = require('../data/display-data.json')
Router = require('../../../components/graph-key/router.coffee')

module.exports.NCView = class NCView extends Backbone.View

  # TODO Refactor mobile
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  scale: 2
  translateX: 280
  translateY: -100
  rotate: [80, 0]
  mapLabel: "% of the population"

  initialize: ->
    @isMobile = @$el.width() < 500

    @reverseColorKey = true
    @$colorKey = @$('.graph-key-container')
    @colorKeyWidth = 100

    @renderSvgMap topoJSON, @$('#three-svg')
    @renderPoints()

    @renderSelectBox()

    @router = new Router
      map: @mapView
      handleSelect: @handleSelectChange

    Backbone.history.start({
      root: '/north-carolina',
      pushState: true
    })

  renderSelectBox: ->
    data = {
      "White" : "White"
      "Black" : "Black"
      "Asian" : "Asian"
      # 'HS graduate': "Has a High-school degree"
      'Bachelors degree': "Has a Bachelor's degree"
      'farming': "Works in Farming"
      "Have children under 18" : "Have children under 18"
      "65+" : "Over 65"
      "hh below poverty line" : "Housholds Below the poverty line"
      "Veteran" : "Vetern"
      "Employed" : "Employed"
      "Unemployed" : "Unemployed"
      "Armed Forces" : "In the Armed Forces"
    }

    @selectBox = new Select
      el: $('#three-select')
      data: data
      includeAll: false

  handleSelectChange: (val) =>
    @selectBox.$el.val(val)
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
    @svgMap.updateMapTitle "#{key} - #{label}"

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

module.exports.init = ->
  new NCView
    el: $ "body"
