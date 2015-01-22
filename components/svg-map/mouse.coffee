_ = require 'underscore'

module.exports =

  onClick: (item, path, g) ->
    if item.id == @activeId
      @activeId = false
      @customClickSelectedArea?()
      return

    @activeId = item.id
    @customOnClick item.id

    @$(".tract").attr('class', 'tract')
    @$(".tract[data-id=\"#{item.id}\"]").attr('class', 'tract selected')
    @updateMapTitle(@title)

    if @zoomOnClick
      bounds = path.bounds(item)
      dx = bounds[1][0] - bounds[0][0]
      dy = bounds[1][1] - bounds[0][1]
      x = (bounds[0][0] + bounds[1][0]) / 2
      y = (bounds[0][1] + bounds[1][1]) / 2
      scale = .9 / Math.max(dx / @width, dy / @height)
      translate = [@width / 2 - scale * x, @height / 2 - scale * y]

      g.transition()
        .duration(@speed)
        .style("stroke-width", "#{1.5 / scale}px")
        .attr("transform", "translate(#{translate})scale(#{scale})")

  reset: (active, g) ->
    @$('.tract.selected').attr('class', 'tract')
    active = d3.select(null)

    g.transition().duration(@speed).style("stroke-width", "1px").attr("transform", "")

  mouseover: (item) ->
    return if item.id == @activeId
    @customMouseEnter?(@activeId, item.id)
    @hoverText?.text @formatHoverText(item)

  mouseleave: ->
    @hoveredId = false
    @hoverText?.text ''
    @customMouseLeave?(@activeId)
