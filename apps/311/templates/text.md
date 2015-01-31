This is a look at 7.7 million 311 calls across all 5 boroughs of New
York from 2010 to 2014.

The first thing you may notice is that not that many people
call 311. In most neighborhoods, only 1 in 100 people call 311 over
the course of a given month (so many 1s!). But, when you think about
the density of New York, with many of these neighborhoods housing over
100,000 people, it amounts to a very, very large 311 service. Between
2010 and 2014, over 7,712,843 311 calls were recorded.

This is similar to some analysis [Wired](http://www.wired.com/2010/11/ff_311_new_york/all/) did in 2010. In previous
analysis, I have found that the neighborhoods of New York are simply,
very very different. Assuming some homoginy under the broad 'New York
City' monicre leeds to uselessly general analysis. In this case, I
wanted to see what problems different neighborhoods encounter over the
course of their day.

## About the data

The 311 data comes from
[NYC Open Data](https://nycopendata.socrata.com/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9)
and the population data by NTA comes from
[NYC Planning](http://www.nyc.gov/html/dcp/html/census/demo_tables_2010.shtml). The
outlines for neighborhoods also come from
[NYC Planning](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml)
in 'Neighborhood Tract Areas' or NTAs for short.

Many of the types of 311 calls have been merged. This data set exists
over a four year period and it seems some of the ways of recording 311
complaints have changed over that time. For example, in 2014, heat
complaints were recorded as 'heat/hot water' complaints. I have merged
those 'heat/hot water' issues with the 'heat' ones. Some types of
complaints don't provide a useful distinction such as 'damaged tree',
'dead tree' and 'overgrown tree' and 'commercial noise', 'street
noise' and 'noise'. So they have been merged. Other complaints seem
like errors. For example, 'street light condition' complaints have
been merged into 'traffic signal condition' complaints.

There are still other issues with the data. About 90% of calls to 311
for 'heat' were recorded at exactly midnight. I don't know if that is
just the universal time to complain about your heat, but it has forced
me to exclude the heat information from the stacked graphs.

## Using streetlights to tell when it is lunch time

For some reason, people don't report streetlights at 1pm. Probably because they are at lunch!

Interestingly, Queens seems to have an earlier lunch time than Brooklyn. There are almost no streetlight complaints in upper manhattan and the Bronx but many in lower manhattan.

## The three chinatowns


## How people wake up
