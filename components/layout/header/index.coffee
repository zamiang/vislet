module.exports.init = ->
  $header = $('.vislet-intro')
  return unless $header.length > 0
  pathName = window.location.pathname.replace(/\/$/, "")
  $header.find('.items a').each (index, item) ->
    $item = $(item)
    href = $item.attr 'href'
    if href == pathName
      $item.addClass 'active'
