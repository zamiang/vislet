Backbone = require 'backbone'
_ = require 'underscore'
parse = require('querystring').parse

module.exports = class Router extends Backbone.Router

  routes:
    "" : 'handleRoute'

  initialize: (options) ->
    @graphs = options.graphs
    @map = options.map
    @handleSelect = options.handleSelect
    @handleOverview = options.handleOverview

  handleRoute: (rawOptions) ->
    options = parse(rawOptions)

    if options.area
      @nta options.area, options.hover
    else if options.type
      @type options.type
    else if options.date
      @date options.date
    else
      @overview()

  overview: ->
    if @handleOverview
      @handleOverview()
    else
      @map.colorMap(@map.slider.getValue())
      @map.updateUI true

  # TODO: these should just trigger events and not call methods on passed in objects :-/
  nta: (nta, hover) ->
    for graph in @graphs
      graph.animateNewArea nta, hover
    @map.handleNeighborhoodSelect nta, hover

  type: (type) ->
    @handleSelect type

  date: (date) ->
    @map.colorMap(Number(date))
