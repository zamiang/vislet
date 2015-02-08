Backbone = require 'backbone'

module.exports = class SelectBox extends Backbone.View

  initialize: (options) ->
    { @data, @dataKey } = options
    @renderSelectBox()

  renderSelectBox: ->
    html = "<option value='ALL'>ALL</option>"
    html +=
      (for key in Object.keys(@data)
        "<option value='#{key}'>#{@data[key]}</option>"
      ).join ''
    @$el
      .html(html)
      .on 'change', =>
        Backbone.history.navigate("/type/#{@$el.val()}", trigger: true)
