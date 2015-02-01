This is a look at 7.7 million 311 calls across all 5 boroughs of New York from 2010 to 2014.

The first thing you may notice is not *that* many people
call 311. In most neighborhoods, only 1 in 100 people call 311 over the course of a given month. But, when you think about the density of New York, with many of these neighborhoods housing over 100,000 people, it amounts to a very, very large 311 service.

This is similar to some analysis [Wired](http://www.wired.com/2010/11/ff_311_new_york/all/) did in 2010. Unlike the Wired article, which looked at New York on the whole, this breaks up the 311 data by neighborhood. In previous analysis, I have found that the neighborhoods of New York are simply, very very different. Assuming some homogeny under the broad 'New York City' moniker leeds to uselessly general analysis. In this case, I wanted to see what problems different neighborhoods encounter over the course of their day.

## About the data

The 311 data comes from [NYC Open Data](https://nycopendata.socrata.com/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9) and the population data by NTA comes from [NYC Planning](http://www.nyc.gov/html/dcp/html/census/demo_tables_2010.shtml). The neighborhood tabulation areas (NTAs, or the boundaries of each neighborhood) come from [Bytes of the Big Apple](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml).

Between 2010 and 2014, over 8,464,747 311 calls were recorded. 751,904 records were not included due to missing x/y coordinates leaving 7,712,843 for visualizing. In order to make the visualization more useful to people, rather than government agencies, some types of 311 calls have been merged. This dataset covers a four year period and classification systems for 311 complaints have changed over that time. For example, in 2014, 'heat' calls started to be recorded as 'heat/hot water'. In addition to classification changes, some classifications don't provide a useful distinction. In this case, 'damaged tree', 'dead tree' and 'overgrown tree' were merged, as well as 'commercial noise', 'street noise' and 'noise'. Other distinctions seem like errors. For example, 'street light condition' calls and 'traffic signal condition' seem like the same thing and have been merged.

There are still other issues with the data. 90%+ of calls to 311 for 'heat' or 'rodent' were recorded at exactly midnight. You can view the raw data for 311 heat calls [here](https://data.cityofnewyork.us/Social-Services/Heat/85ag-bewf). I don't know if that is just the universal time to report issues with your heat or rodent sightings, but it has forced me to exclude them both from the stacked graphs.

## Streetlights work best at lunch time

When clicking around the graph, you may notice a 'camel distrobution' of street light issues. Across NYC, people don't report streetlights issues at 1pm but report the most streetlight issues at 12pm and 2pm. Maybe they report on their way to or from lunch… or maybe streetlights just work better at 1pm.

Interestingly, Queens seems to have an earlier lunch time than Brooklyn. There are almost no streetlight complaints in upper Manhattan and the Bronx but many in lower Manhattan - perhaps manhattan is on a different…something?

## The three chinatowns


## How people wake up
