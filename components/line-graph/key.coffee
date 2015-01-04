template = require './templates/key.jade'

module.exports =

  drawKey: ->
    keys = for line in @lines
      {
        color: @color(line.name)
        text: @displayKey(line.name)
      }

    @$el.after(template(keys: keys, margin: @margin))
