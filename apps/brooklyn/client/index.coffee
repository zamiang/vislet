Backbone = require "backbone"
$ = require 'jquery'
Backbone.$ = $
nycTopoJson = require('./nyc-neighborhoods.json')
svgMapView = require('../../../components/svg-map/index.coffee')

module.exports.BrooklynView = class BrooklynView extends Backbone.View

  initialize: ->
    @renderSvgMap nycTopoJson

  renderSvgMap: (topojson) ->
    topojson.objects.nycneighborhoods.geometries = topojson.objects.nycneighborhoods.geometries.filter (neighborhood) ->
      neighborhood.id = neighborhood.id.split('-')[0]
      unless neighborhood.id and neighborhood.properties.BoroCode == 3
        return false
      true

    new svgMapView
      el: $('#brooklyn-svg')
      topojson: topojson
      key: 'nycneighborhoods'
      ignoredId: 'park'

module.exports.init = ->
  new BrooklynView
    el: $ "body"
