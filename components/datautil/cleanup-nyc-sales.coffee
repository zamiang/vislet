sales = require('../../brooklyn-sales.json')
fs = require('fs')
_s = require('underscore.string')

# From
# "BOROUGH":3,
# "NEIGHBORHOOD":"BATH BEACH               ",
# "BUILDING CLASS CATEGORY":"01  ONE FAMILY DWELLINGS                    ",
# "TAX CLASS AT PRESENT":"1",
# "BLOCK":6360,
# "LOT":14,
# "EASE-MENT":" ",
# "BUILDING CLASS AT PRESENT":"A5",
# "ADDRESS":"8663 15TH   AVENUE                       ",
# "APARTMENT NUMBER":"            ",
# "ZIP CODE":11228,
# "RESIDENTIAL UNITS":1,
# "COMMERCIAL UNITS":0,
# "TOTAL UNITS":1,
# "LAND SQUARE FEET":"1,547",
# "GROSS SQUARE FEET":"2,224",
# "YEAR BUILT":1930,
# "TAX CLASS AT TIME OF SALE":1,
# "BUILDING CLASS AT TIME OF SALE":"A5",
# "SALE PRICE":"$450,000",
# "SALE DATE":"9/8/14"

# TO:
# "buildingClass":"S1",
# "taxClass":1,
# "block":6365,
# "lot":44,
# "easement":"",
# "apartmentNumber":"",
# "residentialUnits":1,
# "commercialUnits":1,
# "totalUnits":2,
# "landSqFt":1473,
# "grossSqFt":1656,
# "built":1931,
# "taxClassAtSale":1,
# "buildingClassAtSale":"S1",
# "price":680000,
# "date":1277856000000

cleanSales = for sale in sales
  {
    buildingClass: _s.trim(sale['BUILDING CLASS CATEGORY'])
    taxClass: sale['TAX CLASS AT PRESENT']
    block: _s.trim sale.BLOCK
    lot: _s.trim sale.LOT
    apartmentNumber: sale['APARTMENT NUMBER']
    residentialUnits: sale['RESIDENTIAL UNITS']
    commercialUnits: sale['COMMERCIAL UNITS']
    totalUnits: sale['TOTAL UNITS']
    landSqFt: sale['LAND SQUARE FEET']
    grossSqFt: sale['GROSS SQUARE FEET']
    built: sale['YEAR BUILT']
    taxClassAtSale: sale['TAX CLASS AT TIME OF SALE']
    buildingClassAtSale: sale['BUILDING CLASS AT TIME OF SALE']
    zip: sale['ZIP CODE']
    price: sale['SALE PRICE']
    date: new Date(sale['SALE DATE']).valueOf()
  }

fs.writeFile "./brooklyn-sales-clean.json", JSON.stringify(cleanSales), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
