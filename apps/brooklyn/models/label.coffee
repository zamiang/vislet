Backbone = require "backbone"

module.exports = class Label extends Backbone.Model

  initialize: ->
    @$text = @get('$el').find(@get('selector'))
    @on 'change:visible', @onVisibleChange
    @on 'change:text', @onTextChange
    @onVisibleChange()

  onTextChange: ->
    @$text.text(@get('text'))

  onVisibleChange: ->
    if @get('visible')
      @get('$el').fadeIn(200)
    else
      @get('$el').fadeOut(200)
