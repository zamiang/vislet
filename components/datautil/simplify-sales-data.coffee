sales = require('../../brooklyn-sales.json')
fs = require('fs')


# {"type":"FeatureCollection","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[-74.00811424745048,40.60889125946299]},"properties":{"buildingClass":"01  ONE FAMILY DWELLINGS","taxClass":"1","block":6363,"lot":119,"apartmentNumber":null,"residentialUnits":1,"commercialUnits":0,"totalUnits":1,"landSqFt":"2,058","grossSqFt":"1,492","built":1930,"taxClassAtSale":1,"buildingCode":"A9","zip":11214,"price":"$670,000","date":1397620800000,"bbl":3063630119,"ntaCode":"BK27","ntaName":"Bath Beach"}},


# Takes geojson and cleans it up into just an array
cleanSales = for feature in sales.features
  sale = feature.properties
  {
    buildingClass: sale.buildingClass
    taxClass: sale.taxClass
    residentialUnits: sale.residentialUnits
    commercialUnits: sale.commercialUnits
    totalUnits: sale.totalUnits
    landSqFt: sale.landSqFt?.replace(',', '')
    grossSqFt: sale.grossSqFt?.replace(',', '')
    built: sale.built
    taxClassAtSale: sale.taxClassAtSale
    buildingClassAtSale: sale.buildingClassAtSale
    price: sale.price?.replace('$', '').replace(',', '').replace(',', '')
    date: sale.date
    ntaCode: sale.ntaCode
  }

fs.writeFile "./brooklyn-sales-clean.json", JSON.stringify(cleanSales), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
