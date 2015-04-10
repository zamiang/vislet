# Gerymandering

Gerymandering is is a strange little political practice. It is something that shakes the foundations of a democracy by allowing some people to intentionally make other people's votes not matter. The sad thing about gerrymandering is that both political party's hands are dirty. It is common practice a party to redraw the congressional boundaries in their favor whenever they get in power. When this happens, existing boundaries are usually moved around to put all the people who vote for the opposing party together into a small number of districts, limiting their influence. This poster-child for corruption generally seems like a bad thing to me but the truth is much more nuanced.

![Wonkblog image explaining Gerrymandering based off reddit post](/images/gerrymandering-explained.jpg)
> - [Washington post redraws a graph from Reddit](http://www.washingtonpost.com/blogs/wonkblog/wp/2015/03/01/this-is-the-best-explanation-of-gerrymandering-you-will-ever-see/)

The above illustration is incredible in that it explains gerrymandering so well while, unintentionally, showing why clearly defining fair congressional districts is virtually impossible. We can all see that number 3 is unfair. But, I would contest, that number 1 is equally unfair. Solution 2 is labeled as 'unfair' but does give red a chance and, by not being homogenous, may create a more balanced political climate within the district. The chart also has labels for 'compactness', hinting that it is important. But, why would 'compactness' be beneficial since it does not make votes more or less fair? In the real world, there are even more factors, like swing voters, races, income classes, industries and political interest groups. With so many factors to take into account, it is difficult for people, much less computers, to agree on what makes a 'fair' district. If gerymandering is clearly bad, what is a fair way to draw congressional districts? If we can define it, could a computer do it and maybe take out some of the human bias?

> In North Carolina, where the two-party House vote was 51 percent Democratic, 49 percent Republican, the average simulated delegation was seven Democrats and six Republicans. The actual outcome? Four Democrats, nine Republicans — a split that occurred in less than 1 percent of simulations. If districts were drawn fairly, this lopsided discrepancy would hardly ever occur.
> - [source](http://www.nytimes.com/2013/02/03/opinion/sunday/the-great-gerrymander-of-2012.html?pagewanted=all&_r=0)

## What is a "fair" congressional district?

Perhaps what makes drawing congressional districts so difficult is that it is difficult to agree on what creates a "fair" district. The broad metric is that every person's vote should be equal. No group should have more or less power through how their voting district is drawn. Gerrymandering works when a party wins the maximum number of seats in a state by sticking the other party’s voters into a small number of very lopsided seats. It is my belief that making all votes equal should be the one true focus of drawing districts. However there may be other aspects to the problem that should be considered.

### Make districts look nice

Many engineers come to the problem of gerymandering with automated solutions for minimizing the irregularity of districts, called 'compactness'. Complex districts act like a sign saying 'someone messed with this'.However, a complex district does not a 'gerrymandered' district make! Despite the fact that complex districts correlate with historic events, they don't actually cause gerrymandering. Gerrymandering is drawing lines that intentionally disenfranchise voters. Due to the fact that similar people tend to live in similar areas, it may take complex district lines to distribute groups such that all votes are equal. Jowei Chen and Jonathan Rodden's research [found](http://www-personal.umich.edu/~jowei/florida.pdf) that Democrats generally do worse when districts are compact simple shapes because they tend to congregate in urban areas. Because of this, we may want to throw out this 'compactness' metric, but as usual, there are other things to consider.

![NYTimes image of complex congressional districts](/images/nytimes-districts.jpg)
> [Source](http://www.nytimes.com/interactive/2013/02/03/sunday-review/imbalance-of-power.html?ref=sunday)

In the figure above, you can see how districts are complex around the country. In the case of North Carolina, district 12 (shown above) was originally drawn by Democrats to encompass the black population so that they can always get at least get one seat. Automated solutions that focus on compactness would, while eliminating some nefarious gerrymandering, would also eliminate this 'good gerrymandering. This may actually turn out to be a good thing since this 'good gerrymandering' later worked to the Democrats disadvantage. Recently, Republicans further packed the district with Democrats, limiting their influence in the more competitive surrounding districts. Gerrymandering is hard!

However, there are many pros to the 'pretty little districts'. Complex districts cause logistical problems for placing the actual voting areas. Complex districts can disenfranchise voters by simply making it a long drive for them to get to the voting booth. In addition to addressing some logistical problems, the nice thing about the automated districs is that their bias is understandable and is not reshaped regularly by politicians. Instead of redrawing districts after every election, the computer controlled districting would simply update as the population changes over time. While automated districting certinaly has some bias, it is an intreaging solutions since it is 'less bad' on many levels and less susceptible to corruption.

### Keep municipal boundaries in tact

The most surprising challenge of drawing voting districts in 'the real world' was dealing with other existing municial boundaries. County officials often need to advocate to people higher up the chain of command in the federal government. If their county is broken up across many congressional districts, it limits the power of those county officials. Instead of having the ear of one official, they have no influence with many. By breaking up counties across congressional districts, you many unintentionally disenfranchize the people of those counties. Hover, in my research, I have not been able to get a sense for the size of this problem. Even today, most counties are spit up across districts in North Carolina.

Taking county and other municipal boundaries into account may sound nice, but could create other problems. Back to the chain of command, it seems odd that smaller groups like counties would control congressional districts. More nefariously, if you take into account counties and municipal boundaries, the practice of gerrymandering would simply move to redrawing those boundaries. As always, there are tradeoffs but since this may create more problems than it solves, I don't believe that keeping counties and municipal boundaries should be a factor in drawing congressional boundaries.

### Keep communities together

There are good reasons to keep "communities of interest" together -- rural with rural, city with city rather than distributing them. By grouping ethic or demographic groups together you can create districts which give some of those groups a good chance of being elected and having a voice. To further explain, say you have a small group. If they are all packed together in a couple of districts, they will at least be able to win a seat or two, whereas if they are spread out, they would nave no influence. This definitely complicated the question of making all votes equal. Are their voices not being heard or are they heard too loudly? I really don't have a clear perspective on which way to go here. This will be a part of what is tested below.

In review, the Tl:dr 'district evaluation guidelines are:

1. One person, one vote! (Every vote should have the same weight.)
2. Keep communities together?
3. Compactness (minimize elongation and irregularity of districts)
4. Minimize number of split counties and municipalities.

## Why now?

A big part of advocating for change is answering 'why now?'. In a world with a world of problems, why worry about gerymandering.

I genuinely believe computers should be drawing our district lines, but I am well aware of the problems of having computers solve problems that humans can't agree on. The belief is that there are so many 'unquantifiable' factors to consider when drawing district lines that humans should just do it. When redistricting, most professionals use [Maptitude for Redistricting](http://www.caliper.com/mtredist.htm) while [Dave's redistricting app](http://gardow.com/davebradlee/redistricting/launchapp.html) allows just about anyone to jump in on the fun. These programs simply allow people to draw lines on a map around census blocks and see how it changes the makeup of the district.

We do need to break from our history here. Those things that have worked in the past do not work now.

The means of comparison are to simulate elections where census-detectable groups vote together.
