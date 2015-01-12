First off, why look at the sales data? Well, I've lived in Brooklyn for about 5 years and want to better understand the wave of Gentrification currently washing over Brooklyn. What I expected to see was Bushwick trailing Williamsburg, Clinton Hill following Fort Green and so on. What I found was just how unique each neighborhood in Brooklyn is. While their differences are obvious from walking around but it is incredible that the differences comes across in residential sales data.

The graphs above are based on the NYC Department of Finance data [here](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml). Below are three 'data vignettes' that should help to
understand and use the visualization above to explore this awesome dataset.

## 1. Brownstones vs Lofts

Bushwick and Brooklyn Heights could not be more different. Historically, Brooklyn Heights is the wealthiest neighborhood in Brooklyn and it shows. They disguise a vent from the underground subway as a brownstone so that it is more visually consistent. Bushwick is a…less visually consistent industrial
neighborhood that over the past decade or so, has converted into artist studios and lofts. The types of property sold in each neighborhood could not be more different.

<div class="svg-container">
<svg id="heights-building-class" class="stacked-area-chart svg-building-class" />
<svg id="bushwick-building-class" class="stacked-area-chart svg-building-class" />
</div>

The building class data is some of the most difficult to compare. This serves as a good example for getting started looking at those graphs.

## 2. 2008 Recovery

One trend you will notice throughout the data is the impact of the 2008 financial crisis on Brooklyn, visible in a dip from 2008 to 2011. While some neighborhoods, like Greenpoint, barely let it dent their meteoric climb, others, like Canarsie are only beginning to recover. Lets take a look at two neighborhoods here - Clinton Hill and Canarsie - which both felt the impact of 2008 but had very different recoveries. In the graph below, you can see that up until about 2011, your money would buy you just about the same amount of indoor space in Clinton Hill as in Canarsie.

<div class="svg-container third-width">
<svg id="clinton-price" class="svg-line-graph third-width" />
</div>

While, I would love to chart a neighborhood's 'number of mentions in the NYTimes real estate section', it is safe to say Clinton Hill received a tremendous amount of press over the past few years. Due to its classification as a historic neighborhood, the type of units solid in sold in Clinton Hill doesn't change very much. Canarsie is similarly stable. It consistently had the largest percentage of Two Family Homes in all of Brooklyn at around 55% of ALL sales. While neither neighborhood has visually changed all much from 2008 until now, they have had very different paths since. Clinton Hill is over $650 while Canarsie is still below peak at around $250.

## 3. The Williamsburg spike

If you are looking for an interesting real estate graph, Williamsburg is probably one of the first places people look. It has transformed over the past decade from one of the most affordable places in Brooklyn (~$150 per sqft) to one of the most expensive (~$550). TODO

<div class="svg-container third-width">
<svg id="williamsburg-sales" class="svg-line-graph third-width" />
</div>

TODO

# Where the data comes from

The raw sales data is on the department of Finance website [here](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml) and the neighborhood tabulation areas are [here](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml). There are some caveats with the data. For example, out of 487,874 residential sales only 223,529 were both individual units and had enough informate to calculate a sane price per square foot. Even then, the data measuring the actual square footage of a property is the 'Gross Square Feet'. Gross SqFt is defined as 'the total area of all the floors of a building as measured from the exterior surfaces of the outside walls of the building, including the land area and space within any building or structure on the property'. A significant portion of the missing sales do not have a sale price, indicating it was a transfer of ownership 'without a cash consideration' possibly from parent to child. Another excluded portion are residential lots with small structures on them.

If you would like to download the dataset used for the visualizations
above. It can be found [here](https://s3.amazonaws.com/vislet-production/data/brooklyn-sales.json). I have also written up how I generated the data on my blog [here](http://www.zamiang.com/posts/post/2015/01/15/apartment-sales/).
