_ = require 'underscore'
Backbone = require 'backbone'

module.exports = class SelectBox extends Backbone.View

  defaults:
    includeAll: true

  initialize: (options) ->
    { @data, @dataKey, @includeAll } = _.defaults(options, @defaults)
    @renderSelectBox()

  renderSelectBox: ->
    if @includeAll
      html = "<option value='ALL'>ALL</option>"
    else
      html = ""
    html +=
      (for key in Object.keys(@data)
        "<option value='#{key}'>#{@data[key]}</option>"
      ).join ''
    @$el
      .html(html)
      .on 'change', =>
        Backbone.history.navigate("/type/#{@$el.val()}", trigger: true)
