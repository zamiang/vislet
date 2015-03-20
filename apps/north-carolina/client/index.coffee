Backbone = require "backbone"
Backbone.$ = $
moment = require 'moment'
MapViewBase = require('../../../components/svg-map/base.coffee')
# neighborhoodNames = require('../data/nyc-neighborhood-names.json')
# threeData = require('../data/display-data.json')
# topoJSON = require('../data/nyc.json')
# complaintTypes = require('../data/complaint-types.json')

module.exports.NCView = class NCView extends Backbone.View

  # TODO Refactor mobile
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  ignoredIds: ['99', '98']
  mapLabel: "311 Reports per 1,000 residents"
  startingDataset: 'BK60'
  mapColorMax: 50

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderMap()

  renderMap: ->
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

module.exports.init = ->
  new NCView
    el: $ "body"
