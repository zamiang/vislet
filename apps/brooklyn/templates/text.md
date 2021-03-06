Why look at the Brooklyn property sales data? Well, I've lived in Brooklyn for about 5 years and want to better understand the wave of gentrification currently washing over Brooklyn. I expected to see Bushwick trailing Williamsburg, Clinton Hill following Fort Green and so on. What I found was just how unique each neighborhood is in Brooklyn. While their differences are obvious from walking around, it is incredible that the differences come across in residential property sales data.

The graphs above are based on the NYC Department of Finance [rolling sales data](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml). Below are two 'data vignettes' that demonstrate how to use the visualization above to explore this awesome dataset.

## 1. A Whole New Neighborhood

<div class="svg-container">
<svg id="williamsburg-building-class" class="stacked-area-chart svg-building-class" />
<svg id="greenpoint-building-class" class="stacked-area-chart svg-building-class" />
</div>

Williamsburg is the poster child of gentrification in Brooklyn, and its sales information does not disappoint. The area has transformed over the past decade from one of the most affordable places in Brooklyn (~$150 per SqFt) to one of the most expensive (~$625). In 2003, it was occupied by 'The Three H's' (Hassids, Hispanics and Hipsters). Today, it is becoming an affluent family neighborhood and shopping area. This is reflected in the types of buildings sold in Williamsburg and Greenpoint, which has changed dramatically since 2003.

These graphs predictably tell the story of developers coming in and building lots of condos. From 2004-2012, there is a steady increase in condo sales and a corresponding decrease in sales of family homes. However, even condo sales start to give way in 2013 when residential sales overall start to take up a smaller percentage of total sales, dropping down to a historic low of around 70% in 2014. What this may indicate is businesses moving into the neighborhood to capitalize on the greater density and wealth of a desirable neighborhood.

## 2. 2008 Recovery

<div class="svg-container third-width">
<svg id="clinton-price" class="svg-line-graph third-width" />
</div>

Throughout the data, the impact of the 2008 financial crisis on Brooklyn real estate is visible as a dip from 2008 to 2011. In some neighborhoods, like Greenpoint, the recession is a temporary dent in an otherwise meteoric climb in prices; others are only beginning to recover.

These two neighborhoods - Clinton Hill and Canarsie - both felt the impact of 2008’s recession and have had very different recoveries. In the graph above, you can see that up until about 2011, your money would have bought about the same amount of residential space in Clinton Hill as it would in Canarsie. Unlike in Williamsburg or Greenpoint, neither neighborhood sees a huge amount of change in the types of units sold, but the divergence in pricing is still dramatic. Today, Clinton Hill residences are priced at over $650/sqft while Canarsie is still below peak at around $250/sqft.

# Where the data comes from

The data presented here is combined from two sources; the rolling sales data comes from the [Department of Finance](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml) and the neighborhood tabulation areas (NTAs, or the boundaries of each neighborhood) come from [Bytes of the Big Apple](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml).

There are a few caveats and changes to the data to be aware of: With the NTAs, I changed the name of BK73 from Williamsburg to South Williamsburg and BK76 from North Side, South Side to Williamsburg to better correlate to how these neighborhoods are referred to in popular culture.

As for the sales, out of 322,056 property sales, I was able to geocode all but 3,244. I chose not to include commercial sales in these graphs since there are relatively few in Brooklyn. 225,876 of the sales were residential but only used 101,168 of them record the sale of property with livable square footage. For example 81,486 residential sales were for below $100 and 48,096 for property with less than 300 SqFt of livable space. The sales with a very low price indicate a transfer of ownership 'without a cash consideration' possibly from parent to child and were excluded from the visualizations. I have mapped the property sales for between $1 and $5,000 [here](http://cdb.io/1Diu6mw). The units with small SqFt are, on many cases, large lots with small structures or shacks on them and were also excluded.

You may notice the large amount of variance to the price per SqFt over the course of a year. One potential factor is that a price per SqFt metric represents apartments and houses differently since it ignores non-livable space. This causes the price per SqFt to be higher than 'natural' for a house with a yard. Simply changing the ratio of houses to apartments sold would change the price per SqFt for a neighborhood. I do not display the distribution of sales here but it may be a way to explore that factor. There also appears to be some seasonality to prices but the trend is difficult to differentiate from broader trends like the housing boom and 2008 recovery. Being in the North East, there is a also seasonality to construction and thus to new building openings. This could also cause variance in prices since a luxury condo opening could shift the average price per SqFt of a neighborhood for the quarter.

In short, there is much more to explore. If you would like to download the dataset used for the visualizations
above, it is [here](https://s3.amazonaws.com/vislet-production/data/brooklyn-sales.json). I have also written up how I generated the data on my blog [here](http://www.zamiang.com/posts/post/2015/01/15/apartment-sales/).

## Thanks

Many thanks to the awesome [Christina Xu](https://twitter.com/xuhulk) who gave helpful feedback on both the text and visualization above, and remains my bitter rival in Gang Beasts.
