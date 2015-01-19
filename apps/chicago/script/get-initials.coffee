module.exports = (name, len) ->
  if name.split(' ').length > 1
    (for item in name.split(' ')
      item.substring(0,len)
    ).join('')
  else
    name.substring(0, len + 1)
