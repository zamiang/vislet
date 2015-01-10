template = require '../graph-key/key.jade'

module.exports =

  drawKey: ->
    keys = for line in @lines
      {
        color: @color(line.name)
        text: @displayKey(line.id or line.name)
      }

    @$el.after(template(keys: keys, margin: @margin))
