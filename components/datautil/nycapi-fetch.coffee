fs = require('fs')
# request = require('superagent')
sales = require('../../missing-bbl.json')
{ NYC_API_ID, NYC_API_KEY } = require('../../config.coffee')

# Example response from NYC API
# {
#  "bbl": {
#   "bbl": "3021377502",
#   "bblBoroughCode": "3",
#   "bblBoroughCodeIn": "3",
#   "bblTaxBlock": "02137",
#   "bblTaxBlockIn": "2137",
#   "bblTaxLot": "7502",
#   "bblTaxLotIn": "1124",
#   "buildingIdentificationNumber": "3059586",
#   "condominiumBillingBbl": "3021377502",
#   "condominiumFlag": "C",
#   "cooperativeIdNumber": "0000",
#   "dofCondominiumIdentificationNumber": "1033",
#   "firstBoroughName": "BROOKLYN",
#   "geosupportFunctionCode": "BL",
#   "geosupportReturnCode": "00",
#   "gi5DigitStreetCode1": "78730",
#   "giBoroughCode1": "3",
#   "giBuildingIdentificationNumber1": "3059586",
#   "giDcpPreferredLgc1": "01",
#   "giHighHouseNumber1": "108",
#   "giLowHouseNumber1": "102",
#   "giSideOfStreetIndicator1": "R",
#   "giStreetCode1": "37873001",
#   "giStreetName1": "SOUTH    8 STREET",
#   "highBblOfThisBuildingsCondominiumUnits": "3021371128",
#   "internalLabelXCoordinate": "0993905",
#   "internalLabelYCoordinate": "0197738",
#   "latitudeInternalLabel": 40.70941657800013,
#   "longitudeInternalLabel": -73.96517478595058,
#   "lowBblOfThisBuildingsCondominiumUnits": "3021371101",
#   "lowHouseNumberOfDefiningAddressRange": "000102000AA",
#   "modeSwitchIn": "X",
#   "numberOfEntriesInListOfGeographicIdentifiers": "0001",
#   "numberOfExistingStructuresOnLot": "0001",
#   "numberOfStreetFrontagesOfLot": "01",
#   "returnCode1a": "00",
#   "rpadBuildingClassificationCode": "R4",
#   "rpadSelfCheckCodeForBbl": "6",
#   "sanbornBoroughCode": "3",
#   "sanbornPageNumber": "012",
#   "sanbornVolumeNumber": "03",
#   "selfCheckCodeOfBillingBbl": "6",
#   "taxMapNumberSectionAndVolume": "30801",
#   "workAreaFormatIndicatorIn": "C"
#  }
# }


# BBL returned from NYC API does not always match the block and lot requested so we track both
bblToLatLong = {}
blockLotToBBL = {}

max = sales.length
doneCount = 0
failCount = 0

fetchNextBorough = ->
  doneCount++
  if sales[doneCount]
    fetchBorough sales[doneCount][0], sales[doneCount][1]
  else
    console.log 'done!'
    save()

save = ->
  console.log 'About to save'
  fs.writeFile "./bbl-to-lat-long.json", JSON.stringify(bblToLatLong), (err) ->
    if (err)
      console.log(err)
    else
      console.log "The file was saved!"

  fs.writeFile "./block-lot-to-bbl.json", JSON.stringify(blockLotToBBL), (err) ->
    if (err)
      console.log err
    else
      console.log "The file was saved!"

# Save every 2 hours
setInterval save, 2 * 60 * 60 * 1000

fetchBorough = (block, lot) ->
  request.get("https://api.cityofnewyork.us/geoclient/v1/bbl.json")
    .query(
      app_id: NYC_API_ID
      app_key: NYC_API_KEY
      borough: 'Brooklyn'
      block: block
      lot: lot
    ).end((response) ->
      if bbl = response.body?.bbl
        bblToLatLong[bbl.bbl] = [bbl.latitudeInternalLabel, bbl.longitudeInternalLabel]
        blockLotToBBL["#{block}-#{lot}"] = bbl.bbl
        if doneCount >= max
          save()
        else
          fetchNextBorough()
      else
        failCount++
        console.log response.body, failCount, doneCount
        save()
    )

fetchNextBorough()
