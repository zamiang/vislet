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

  overview: ->
    @map.colorMap(@map.slider.getValue())
    @map.updateUI true

  nta: (nta, hover) ->
    for graph in @graphs
      graph.animateNewArea nta, hover
    @map.handleNeighborhoodSelect nta, hover

  type: (type) ->
    @handleSelect type

  date: (date) ->
    @map.colorMap(Number(date))
