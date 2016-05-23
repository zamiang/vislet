Backbone = require 'backbone'
SvgMapView = require('../../../components/svg-map/index.coffee')

# Quick experiment with overriding mouse handling
module.exports = class SvgMap extends SvgMapView

  onClick: (item, path, g) -> return

  # @override
  mouseover: (item) ->
    super
    Backbone.history.navigate("?area=#{@mapType}&hover=#{item.id}", trigger: true)
