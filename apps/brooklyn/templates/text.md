Why look at the Brooklyn property sales data? Well, I've lived in Brooklyn for about 5 years and want to better understand the wave of gentrification currently washing over Brooklyn. I expected to see was Bushwick trailing Williamsburg, Clinton Hill following Fort Green and so on. What I found was just how unique each neighborhood is in Brooklyn. While their differences are obvious from walking around, it is incredible that the differences come across in residential property sales data.

The graphs above are based on the NYC Department of Finance data [here](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml). Below are three 'data vignettes' that demonstrate how to use the visualization above to explore this awesome dataset.

## 1. A Whole New Neighborhood

If you are looking for an interesting real estate graph, Williamsburg is one the first places to look. The area has transformed over the past decade from one of the most affordable places in Brooklyn (~$150 per SqFt) to one of the most expensive (~$625). In 2003, it was occupied by 'The Three H's' (Hassids, Hispanics and Hipsters). Today, it is becoming an affluent family neighborhood slash shopping area. Lets look at how the types of buildings being sold in Williamsburg and Greenpoint have changed since 2003.

<div class="svg-container">
<svg id="williamsburg-building-class" class="stacked-area-chart svg-building-class" />
<svg id="greenpoint-building-class" class="stacked-area-chart svg-building-class" />
</div>

At first glance, these property type graphs tell the story of developers coming in and building lots of condos. From 2004-2012 there is a strong increase in condo sales and a strong decrease in family home sales. Interestingly, even that begins to give way in 2013 when residential sales begin to take a smaller percentage of total sales-- down to ~90% to ~70%. This may show the neighborhood becoming a very desirable place to live and then shops and restaurants being created to capitalize on the greater density and wealth.

## 2. 2008 Recovery

One trend you will notice throughout the data is the impact of the 2008 financial crisis on Brooklyn, visible in a dip from 2008 to 2011. While some neighborhoods, like Greenpoint, barely let it dent their meteoric climb, others are only beginning to recover. Lets take a look at two neighborhoods here - Clinton Hill and Canarsie - which both felt the impact of 2008 but had very different recoveries. In the graph below, you can see that up until about 2011, your money would buy just about the same amount of indoor space in Clinton Hill as in Canarsie.

<div class="svg-container third-width">
<svg id="clinton-price" class="svg-line-graph third-width" />
</div>

While, I would love to chart a neighborhood's 'number of mentions in the New York Times Real Estate section', it is safe to say Clinton Hill received a tremendous amount of press over the past few years. Due to its classification as a historic neighborhood, the type of units solid in Clinton Hill doesn't change very much. Canarsie is similarly stable with the largest percentage of Two Family Homes in all of Brooklyn at around 55% of ALL sales. While neither neighborhood has visually changed much from 2008 until now, they have had very different paths since. Clinton Hill is over $650 per SqFt while Canarsie is still below peak at around $250.

## 3. Brownstones vs Lofts

Bushwick and Brooklyn Heights could not be more different. Historically, Brooklyn Heights is the wealthiest neighborhood in Brooklyn and it shows. They disguise a vent from the underground subway as a brownstone so that it is more visually consistent. Bushwick is a…less visually consistent industrial neighborhood.  Over the past decade or so, much of Bushwick has converted into artist studios and lofts. The types of property sold in each neighborhood could not be more different.

<div class="svg-container">
<svg id="heights-building-class" class="stacked-area-chart svg-building-class" />
<svg id="bushwick-building-class" class="stacked-area-chart svg-building-class" />
</div>

The building class data is some of the most difficult to compare. Looking at these two neighborhoods shows the dramatic variety of building stock in Brooklyn.

# Where the data comes from

The data here is a combination of two sources; the sales data is on the department of [Finance website](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml) and the neighborhood tabulation areas are from [nyc.gov](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml). I have made some alterations to the data. The raw sales data also includes commercial sales but I chose not to display them since there are relatively few. With the NTAs, I changed the name of BK73 from Williamsburg to South Williamsburg and BK76 from North Side, South Side to Williamsburg. I feel this maps better to how these neighborhoods are referred to in popular culture.

There are some caveats with the data. For example, out of 487,874 residential sales only 223,529 were both individual units and had enough information to calculate a sane price per square foot. Even then, the data for square feet is the 'Gross Square Feet'. Gross SqFt is defined as 'the total area of all the floors of a building as measured from the exterior surfaces of the outside walls of the building, including the land area and space within any building or structure on the property'. A significant portion of the missing sales do not have a sale price, indicating it was a transfer of ownership 'without a cash consideration' possibly from parent to child. Another excluded portion are residential lots with small structures on them.

You may notice the large amount of variance to the price per SqFt over the course of a year. One potential factor is that a price per SqFt metric represents apartments and houses differently since it ignores non-livable space. This causes the price per SqFt to be higher than 'natural' for a house with a yard. Simply changing the ratio of houses to apartments sold would change the price per SqFt for a neighborhood. I do not display the distribution of sales here but it may be a way to explore that factor. There also appears to be some seasonality to prices but the trend is difficult to differentiate from broader trends like the housing boom and 2008 recovery. Being in the North East, there is a also seasonality to construction and thus to new building openings. This could also cause variance in prices since a luxury condo opening could shift the average price per SqFt of a neighborhood for the quarter.

In short, there is much more to explore. If you would like to download the dataset used for the visualizations
above, it is [here](https://s3.amazonaws.com/vislet-production/data/brooklyn-sales.json). I have also written up how I generated the data on my blog [here](http://www.zamiang.com/posts/post/2015/01/15/apartment-sales/).

## Thanks

Many thanks to the awesome [Christina Xu](https://twitter.com/xuhulk) who, in helping conceptualize the both the text and visualization above, left this sentence untouched.
