Backbone = require 'backbone'

module.exports = class Router extends Backbone.Router

  routes:
    ""           : 'overview'
    "area/:nta?hover=:hover" : 'nta'
    "area/:nta"  : 'nta'
    "type/:type" : 'type'
    "date/:date" : 'date'

  initialize: (options) ->
    @graphs = options.graphs
    @map = options.map
    @handleSelect = options.handleSelect
    @handleOverview = options.handleOverview

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
