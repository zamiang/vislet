# Brooklyn Apartment Sales

This is a quick writeup of how I was able to geocode apartment sales
in New York and then associate each sale with a neighborhood. The raw
sales data is on the department of Finance website
[here](http://www.nyc.gov/html/dof/html/property/rolling_sales_data.shtml)
and the neighborhood tabulation areas are
[here](http://www.nyc.gov/html/dcp/html/bytes/dwn_nynta.shtml). I am
very new to the toolchain for geo work and prefer methods that give me
visual feedback. Because of this, I have chosen to use Node for data
processing and [QGIS](http://www.qgis.org/en/site/) for merging
datasets and checking work as we go. All things perfect, the correct
way to do this would be to import and merge the datasets in
PostGIS.

If you would like to download the dataset. It can be found
[here](datset). This post mostly serves to document how the dataset
was created if there are any issues.

I have visualized this dataset a bit [here](vislet).

## Gather

First, download the apartment sales data in Excel format from the NYC
Department of Finance website. In this example, we will be combining
all available years of data with the rolling sales data to create a
dataset of sales from the beginning of 2003 to the end of 2014.

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

In my initial attempt, I tried to geocode the sales data using the
PLUTO dataset. This will merely geocode 242,473 out of 318,713
sales. I then tried to fill out the remaining sales data using the NYC
api, simply making API requests for each of the sales missing geo
data. This relies of the assumption that NYC has agreed on a
projection of the earth, but alas they have not. This resulted in a
useless dataset with two Brooklyns a couple hundred miles apart. Not
ideal! So what do we do? We use the
[NYC API](https://api.cityofnewyork.us/geoclient/v1/doc) for the whole
thing.

First we generate a list of BBL's missing lat-long `coffee
components/datautil/bbl-missing-lat-long.coffee`. And then run
`foreman run coffee components/datautil/nycapi-fetch.coffee`. I tried
to be nice and not parallelize requests to the API so this took a
solid day.

Now that we have a set of geocoded sales, we can import them into
QGIS. This will display the sales in a nice brooklyn-esq shape but
without much else. Next we will add neighborhoods.

## Merge with neighborhood tabulation areas

This time we will try to merge the neighborhood tabulation areas with
our geocoded sales dataset in QGIS.

The main issue here is that our geocoded sales and the NTAs use a
different projection. Through messing around with CRS transformations
in QGIS I was unable to get the two datasets to overlap. As a last
ditch effort, I decided to import the neighborhood data into
[CartoDB](https://cartodb.com/) and then re-export it. Their export
was correct. I was able to get them to overlap
perfectly by setting both sales dataset and the neighborhoods
dataset to the WGS 84 projection.

The next step is to merge them. QGIS has a nice function for this
under Vector -> Data management tools -> Join Attributes by
location. It may sound like your laptop is trying to lift off and
become a drone, but be patient. After a little while, you will end up
with a dataset merging the two. Sadly, this moves every column from
the neighborhood dataset on to each of the individual sales making for
an enormus dataset.

Before exporting this shapefile, use the `Table Manager` plugin for
QGIS to remove all of the neighborhood columns except the ID and name
if needed. All we want to do is to be able to associate the individual
sale with the neighborhood.
