Backbone = require 'backbone'
moment = require 'moment'

module.exports = class Crime extends Backbone.Model

  initialize: ->
    @setupDate()

  setupDate: ->
    date = moment(@get('Date'), 'MM/DD/YYYY hh:mm:SS A')
    @set
      quarter: date.quarter()
      month: date.months() + 1
      year: date.year()
