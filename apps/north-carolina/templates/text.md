This project takes a closer look at gerrymandering though visually comparing different solutions for drawing congressional districts. [Gerrymandering](http://en.wikipedia.org/wiki/Gerrymandering) is the practice of manipulating the boundaries of voting districts to give a political party more power. Gerrymandering in the USA is done by both major parties and appears to be more severe here in the US than any other major democracy. The central issue with gerrymandering is that by selectively limiting the power of votes, it can lead to near-permanent 1-party domination and limit voter choice.

My motivation for this is two fold. First, I believe more people should have an informed perspective on how their vote is counted. I build interactive web experiences and it seems people are better able to learn and understand complex information, such as gerrymandering, when it is made interactive. My second motivation is that I believe humans should not be introducing bias by hand drawing district lines and I want to test if that is true.

This is a challenging proposition since, it is difficult for people, much less computers, to agree on what makes a 'fair' district. With this project, I hope to look at many existing methods for drawing districts and provide some transparency into what they are optimizing for. With these visualizations, I don't seek to discover new methods for drawing districts but to provide a framework that helps people better understand the challenges and tradeoffs of various district drawing solutions. I hope my contribution here is in making the complexities of drawing congressional districts easier to grasp while thoughtfully advocating for a fair path forward.

![Wonkblog image explaining Gerrymandering based off reddit post](/images/gerrymandering-explained.jpg)
> [Source](http://www.washingtonpost.com/blogs/wonkblog/wp/2015/03/01/this-is-the-best-explanation-of-gerrymandering-you-will-ever-see/)

## What is a "fair" congressional district?

Perhaps what makes drawing congressional districts so difficult is that it is difficult to agree on what creates a "fair" district. The broad metric is that every person's vote should be equal. No group should have more or less power through how their voting district is drawn. Gerrymandering works when a party wins the maximum number of seats in a state by sticking the other party’s voters into a small number of very lopsided seats. It is my belief that making all votes equal should be the one true focus of drawing districts. However there are some other ideas:

### Make districts look nice

Many people advocate for minimizing the irregularity of districts. However, the complexity of a district outline doesn't necessarily make it more 'gerrymandered'. Gerrymandering is drawing lines that intentionally disenfranchise voters. Due to the fact that similar people tend to live in similar areas, it may take complex district lines to distribute groups such that all votes are equal. Jowei Chen and Jonathan Rodden's research [simulated](http://www-personal.umich.edu/~jowei/florida.pdf) thousands of redistricting plans and found Democrats generally do worse when districts are compact simple shapes. This is because democrats tend to congregate in urban areas.

![NYTimes image of complex congressional districts](/images/nytimes-districts.jpg)
> [Source](http://www.nytimes.com/interactive/2013/02/03/sunday-review/imbalance-of-power.html?ref=sunday)

In the figure above, you can see how districts are complex around the country. It is not their complexity that makes them bad, it is that they limit the voices of certain segments of the population. Although, complex districts are the poster child of gerrymandering, I don't believe 'prettyness' should be a factor in evaluating if districts are more fair. Complex districts may correlate with gerrymandering but do not cause it.


### Keep municipal boundaries in tact

If county and congressional districts don't align, county government officials would need to work between multiple congressional districts without a specific advocate within federal government. I honestly don't know how big of a problem that really is but it is already an issue with the gerrymandered district we have today. Congress, operating on a national scale, has more impact and should be leading how districts are drawn, not following counties. More nefariously, if you take into account counties and municipal boundaries, the practice of gerrymandering would simply move to redrawing those boundaries. As a result, I don't believe that keeping counties and municipal boundaries should be a factor in drawing congressional boundaries.

### Keep communities together

There are good reasons to keep "communities of interest" together -- rural with rural, city with city rather than distributing them. By grouping ethic or demographic groups together you can create districts which give some of those groups a good chance of being elected. To further explain, say you have a small group. If they are all packed together in a couple of districts, they will at least be able to win a seat or two, whereas if they are spread out, they would nave no influence. This definitely complicated the question of making all votes equal. Are their voices heard or are they heard too loudly? I really don't have a clear perspective on which way to go here. This will be a part of what is tested below.

In short, the Tl:dr 'district evaluation guidelines are:

1. One person, one vote! (Every vote should have the same weight.)
2. Keep communities together?
3. Compactness (minimize elongation and irregularity of districts)
4. Minimize number of split counties and municipalities.

## Why now?

A big part of advocating for change is answering 'why now?'. In a world with a world of problems, why worry about gerymandering.

I genuinely believe computers should be drawing our district lines, but I am well aware of the problems of having computers solve problems that humans can't agree on. The belief is that there are so many 'unquantifiable' factors to consider when drawing district lines that humans should just do it. When redistricting, most professionals use [Maptitude for Redistricting](http://www.caliper.com/mtredist.htm) while [Dave's redistricting app](http://gardow.com/davebradlee/redistricting/launchapp.html) allows just about anyone to jump in on the fun. These programs simply allow people to draw lines on a map and see how census trackable changes

We do need to break from our history here. Those things that have worked in the past do not work now.

The means of comparison are to simulate elections where census-detectable groups vote together.

> In North Carolina, where the two-party House vote was 51 percent Democratic, 49 percent Republican, the average simulated delegation was seven Democrats and six Republicans. The actual outcome? Four Democrats, nine Republicans — a split that occurred in less than 1 percent of simulations. If districts were drawn fairly, this lopsided discrepancy would hardly ever occur.
> - [source](http://www.nytimes.com/2013/02/03/opinion/sunday/the-great-gerrymander-of-2012.html?pagewanted=all&_r=0)

For me this issue comes from a year of a much stronger race conversation happening in the United States. Reading the Ta nehsi Coats 'The Case for Reparations' and then watching Selma made me very inspired to think about the boring problems. The 'boring problems' like redlining and gerrymandering are in many ways the more insidious systems of exclusion.