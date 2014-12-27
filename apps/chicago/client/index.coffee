Backbone = require "backbone"
$ = require 'jquery'
Backbone.$ = $
chicagoTopojson = require('./neighborhoods.json')
svgMapView = require('../../../components/svg-map/index.coffee')

module.exports.HomeView = class HomeView extends Backbone.View

  initialize: ->
    new svgMapView
      el: $('#chicago-svg')
      topojson: chicagoTopojson
      key: 'neighborhoods'

module.exports.init = ->
  new HomeView
    el: $ "body"
