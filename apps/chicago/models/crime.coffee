Backbone = require 'backbone'
moment = require 'moment'

module.exports = class Crime extends Backbone.Model

  initialize: ->
    @setupDate()

  setupDate: ->
    date = moment(@get('Date'))
    @set
      quarter: date.quarter()
      month: date.months()
      year: date.year()
