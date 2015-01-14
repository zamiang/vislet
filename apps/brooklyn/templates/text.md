Why look at the Brooklyn property sales data? Well, I've lived in Brooklyn for about 5 years and want to better understand the wave of gentrification currently washing over Brooklyn. I expected to see was Bushwick trailing Williamsburg, Clinton Hill following Fort Green and so on. What I found was just how unique each neighborhood is in Brooklyn. While their differences are obvious from walking around, it is incredible that the differences come across in residential property sales data.

The graphs above are based on the NYC Department of Finance [rolling sales data](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml). Below are two 'data vignettes' that demonstrate how to use the visualization above to explore this awesome dataset.

## 1. A Whole New Neighborhood

Williamsburg is the poster child of gentrification in Brooklyn, and its sales information does not disappoint. The area has transformed over the past decade from one of the most affordable places in Brooklyn (~$150 per SqFt) to one of the most expensive (~$625). In 2003, it was occupied by 'The Three H's' (Hassids, Hispanics and Hipsters). Today, it is becoming an affluent family neighborhood and shopping area. This is reflected in the types of buildings sold in Williamsburg and Greenpoint, which has changed dramatically since 2003.

<div class="svg-container">
<svg id="williamsburg-building-class" class="stacked-area-chart svg-building-class" />
<svg id="greenpoint-building-class" class="stacked-area-chart svg-building-class" />
</div>

At first glance, these property type graphs tell the story of developers coming in and building lots of condos. From 2004-2012, there is a steady increase in condo sales and a corresponding decrease in sales of family homes. However, even condo sales start to give way in 2013 when residential sales overall start to take up a smaller percentage of total sales, dropping down to a historic low of around 70% in 2014. What this may indicate is businesses moving into the neighborhood to capitalize on the greater density and wealth of a desirable neighborhood.

## 2. 2008 Recovery

Throughout the data, the impact of the 2008 financial crisis on Brooklyn real estate is visible as a dip from 2008 to 2011. In some neighborhoods, like Greenpoint, the recession is a temporary dent in an otherwise meteoric climb in prices; others are only beginning to recover.
<div class="svg-container third-width">
<svg id="clinton-price" class="svg-line-graph third-width" />
</div>

These two neighborhoods - Clinton Hill and Canarsie - both felt the impact of 2008’s recession and have had very different recoveries. In the graph below, you can see that up until about 2011, your money would have bought about the same amount of residential space in Clinton Hill as it would in Canarsie. Unlike in Williamsburg or Greenpoint, neither neighborhood sees a huge amount of change in the types of units sold, but the divergence in pricing is still dramatic. Today, Clinton Hill residences are priced at over $650/sqft while Canarsie is still below peak at around $250/sqft.

# Where the data comes from

The data here is a combination of two sources; the sales data is on the [Department of Finance website](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml) and the neighborhood tabulation areas are from [Bytes of the Big Apple](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml). I have made some alterations to the data. The raw sales data also includes commercial sales but I chose not to display them since there are relatively few. With the NTAs, I changed the name of BK73 from Williamsburg to South Williamsburg and BK76 from North Side, South Side to Williamsburg. I feel this maps better to how these neighborhoods are referred to in popular culture.

There are some caveats with the data. For example, out of 487,874 residential sales only 223,529 were both individual units and had enough information to calculate a sane price per square foot. Even then, the data for square feet is the 'Gross Square Feet'. Gross SqFt is defined as 'the total area of all the floors of a building as measured from the exterior surfaces of the outside walls of the building, including the land area and space within any building or structure on the property'. A significant portion of the missing sales do not have a sale price, indicating it was a transfer of ownership 'without a cash consideration' possibly from parent to child. Another excluded portion are residential lots with small structures on them.

You may notice the large amount of variance to the price per SqFt over the course of a year. One potential factor is that a price per SqFt metric represents apartments and houses differently since it ignores non-livable space. This causes the price per SqFt to be higher than 'natural' for a house with a yard. Simply changing the ratio of houses to apartments sold would change the price per SqFt for a neighborhood. I do not display the distribution of sales here but it may be a way to explore that factor. There also appears to be some seasonality to prices but the trend is difficult to differentiate from broader trends like the housing boom and 2008 recovery. Being in the North East, there is a also seasonality to construction and thus to new building openings. This could also cause variance in prices since a luxury condo opening could shift the average price per SqFt of a neighborhood for the quarter.

In short, there is much more to explore. If you would like to download the dataset used for the visualizations
above, it is [here](https://s3.amazonaws.com/vislet-production/data/brooklyn-sales.json). I have also written up how I generated the data on my blog [here](http://www.zamiang.com/posts/post/2015/01/15/apartment-sales/).

## Thanks

Many thanks to the awesome [Christina Xu](https://twitter.com/xuhulk) who, in helping conceptualize the both the text and visualization above, left this sentence untouched.
