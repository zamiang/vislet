# A look at the NYC Department of Finance Sales Data

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

There is certainly a lot more to look at with Williamsburg - such as
the % of commercial sales - but this is a good start.


# Where the data comes from

This is a quick writeup of how to geocode property sales in New York and then associate each sale with a neighborhood. The raw sales data is on the department of Finance website [here](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml)
and the neighborhood tabulation areas are
[here](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml). I am very new to the toolchain for geo work and prefer methods that give visual feedback. Because of this, I use Node for data processing and
[QGIS](http://www.qgis.org/en/site/) for merging datasets and checking work. All things perfect, the correct way to do this would be to import and merge the datasets in PostGIS.

There are some caveats with the data. For example, out of 487,874 residential sales only 223,529 had enough to get a sane price per square foot. Even then, the data measuring the actual square footage of a property is the 'Gross Square Feet'. It is total area of all the
floors of a building as measured from the exterior surfaces of the outside walls of the building, including the land area and space within any building or structure on the property. A significant portion of the missing sales do not have a sale price, indicating it was a transfer of ownership 'without a cash consideration' possibly
from parent to child. Another excluded portion are residential lots
with small structures on them.

If you would like to download the dataset used for the visualizations
above. It can be found
[here](https://s3.amazonaws.com/vislet-production/data/brooklyn-sales.json). The
description below to document how that dataset was created.

## Gather

First, download each individual year of the apartment sales data in
Excel format from the NYC Department of Finance website. In this
example, we will be combining all available years of data with the
rolling sales data to create a dataset of sales from the beginning of
2003 to the end of 2014.

Combining them is not that difficult since they are formatted the
same. I was able to combine them by simply dragging them all into
[Google Refine](https://github.com/OpenRefine) at the same time.

After getting the desired data into one Google Refine project, export
the project into a CSV and then to JSON for easier working in Node
land.

## Clean

You should now have a file of sales in json format. Next, run `coffee
components/datautil/cleanup_nyc_sales.coffee`. This will make the key
names more javaScriptFriendly and trim whitespace from the end of
lines.

## Geocode

I tried to geocode the sales data using the PLUTO dataset. Sadly,
because the sales happen over the past 11 years, many don't exist in
the current PLUTO dataset. This will merely geocode 242,473 out of
318,713 sales. I then tried to fill out the remaining sales data using
the NYC api, simply making API requests for each of the sales missing
geo data. This relies of the assumption that NYC has agreed on a
projection of the earth, but alas they have not. This resulted in a
useless dataset with two Brooklyns a couple hundred miles apart. Not
ideal! So what do we do? We use the
[NYC API](https://api.cityofnewyork.us/geoclient/v1/doc) for the whole
thing.

First we generate a list of BBL's missing lat-long `coffee
components/datautil/bbl-missing-lat-long.coffee`. And then run
`foreman run coffee components/datautil/nycapi-fetch.coffee`. I tried
to be nice and not parallelize requests to the API so this script
takes a full day to run.

Now that we have a set of geocoded sales, we can import them into
QGIS. This will display the sales in a nice brooklyn-esq shape but
without much else. Next up is to add add neighborhoods.

## Merge with neighborhood tabulation areas

This time we will try to merge the neighborhood tabulation areas with
our geocoded sales dataset in QGIS.

The main issue here is that our geocoded sales and the NTAs use a
different projection. Through messing around with CRS transformations
in QGIS I was unable to get the two datasets to overlap. For some
reason, if you import the neighborhood data into
[CartoDB](https://cartodb.com/) and then re-export it, the resulting
data is mergeable with the sales data. I was able to get them to
overlap perfectly by setting both sales dataset and the neighborhoods
dataset to the WGS 84 projection.

The next step is to merge them. QGIS has a nice function for this
under Vector -> Data management tools -> Join Attributes by
location. It may sound like your laptop is trying to lift off and
become a drone, but be patient. After a little while, you will end up
with a dataset merging the two. Sadly, this moves every column from
the neighborhood dataset on to each of the individual sales making for
an enormous dataset.

Before exporting this shapefile, use the `Table Manager` plugin for
QGIS to remove all of the neighborhood columns except the ID and name
if needed. All we want to do is to be able to associate the individual
sale with the neighborhood. Now export and you will have geocoded NYC
sales data grouped by NTA.
