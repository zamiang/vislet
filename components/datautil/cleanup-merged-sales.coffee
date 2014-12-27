sales = require('../../neighborhood-sales-join.json')
fs = require('fs')
_s = require('underscore.string')

# From
# {
# "type": "FeatureCollection",
# "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
# "features": [
# { "type": "Feature", "properties": { "buildingCl": "01  ONE FAMILY DWELLINGS", "taxClass": "1", "block": 6363, "lot": 119, "easement": null, "apartmentN": null, "residentia": 1, "commercial": 0, "totalUnits": 1, "landSqFt": "2,058", "grossSqFt": "1,492", "built": 1930, "taxClassAt": 1, "building_1": "A9", "zip": 11214, "price": "$670,000", "date": 1397620800000.000000, "bbl": 3063630119.000000, "coords": null, "x": 40.608891, "y": -74.008114, "borocode": 3, "boroname": "Brooklyn", "countyfips": "047", "ntacode": "BK27", "ntaname": "Bath Beach" }, "geometry": { "type": "Point", "coordinates": [ -74.008114247450479, 40.608891259462993 ] }

cleanSales =
  type: "FeatureCollection"
  crs:
    type: "name"
    properties: { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
  features: []

cleanSales.features = for sale in sales.features
  {
    type: 'Feature'
    geometry: sale.geometry
    properties:
      buildingClass: _s.trim(sale.properties.buildingCl)
      taxClass: sale.properties.taxClass
      block: sale.properties.block
      lot: sale.properties.lot
      apartmentNumber: sale.properties.apartmentN
      residentialUnits: sale.properties.residentia
      commercialUnits: sale.properties.commercial
      totalUnits: sale.properties.totalUnits
      landSqFt: sale.properties.landSqFt
      grossSqFt: sale.properties.grossSqFt
      built: sale.properties.built
      taxClassAtSale: sale.properties.taxClassAt
      buildingCode: sale.properties.building_1
      zip: sale.properties.zip
      price: sale.properties.price
      date: Math.floor(sale.properties.date)
      bbl: Math.floor(sale.properties.bbl)
      ntaCode: sale.properties.ntacode
      ntaName: sale.properties.ntaname
  }

fs.writeFile "./brooklyn-sales.json", JSON.stringify(cleanSales), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
