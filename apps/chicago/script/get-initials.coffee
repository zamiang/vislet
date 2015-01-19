module.exports = (name) ->
  if name.split(' ').length > 1
    (for item in name.split(' ')
      item.substring(0,3)
    ).join('')
  else
    name.substring(0, 4)
