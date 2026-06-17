/**
 * Brooklyn — interactive page component.
 *
 * Ports apps/brooklyn/client/index.coffee to a typed React 19 island.
 * Fetches data lazily from /public/data/brooklyn/ on mount; no data bundled.
 * URL deep-link wiring via @/lib/url-state (area, date params).
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AreaChart } from '@/components/AreaChart';
import { DateSlider } from '@/components/DateSlider';
import { LineGraph } from '@/components/LineGraph';
import { ScatterChart } from '@/components/ScatterChart';
import { SvgMap } from '@/components/SvgMap';
import type { AreaData } from '@/lib/area-chart';
import { type CpiData, indexToBase, makeDeflator } from '@/lib/cpi';
import { formatName } from '@/lib/format';
import type { LineGraphData } from '@/lib/line-chart';
import { computeGrowthScatter } from '@/lib/neighborhood-scatter';
import { parseGraphState, serializeGraphState } from '@/lib/url-state';
import type { BrooklynData, ColorDatum, DataPoint } from '@/types';

/** Line-chart display modes. */
type PriceView = 'nominal' | 'real' | 'indexed';
const PRICE_VIEWS: { id: PriceView; label: string }[] = [
  { id: 'nominal', label: 'Nominal $' },
  { id: 'real', label: 'Real $ (2025)' },
  { id: 'indexed', label: 'Indexed (start=100)' },
];

const MAP_WIDTH = 500;
const MAP_HEIGHT = 400;
const CHART_WIDTH = 490;
const CHART_HEIGHT = 230;
const SLIDER_WIDTH = 502;
const IGNORED_IDS = ['99', '98'];
const DEFAULT_AREA = 'BK0102'; // Williamsburg (2020 NTA) — pre-selected on load

export function Brooklyn() {
  const [salesData, setSalesData] = useState<BrooklynData | null>(null);
  const [topology, setTopology] = useState<unknown>(null);
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({});
  const [buildingClasses, setBuildingClasses] = useState<Record<string, string>>({});
  const [cpi, setCpi] = useState<CpiData | null>(null);
  const [priceView, setPriceView] = useState<PriceView>('nominal');
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_AREA);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      fetch('/data/brooklyn/brooklyn-sales-display-data.json').then((r) => r.json()),
      fetch('/data/brooklyn/brooklyn.json').then((r) => r.json()),
      fetch('/data/brooklyn/nyc-neighborhood-names.json').then((r) => r.json()),
      fetch('/data/brooklyn/building-class.json').then((r) => r.json()),
      fetch('/data/cpi-us.json').then((r) => r.json()),
    ]).then(([sales, topo, names, classes, cpiData]) => {
      const typedSales = sales as BrooklynData;
      setSalesData(typedSales);
      setTopology(topo);
      setNeighborhoodNames(names as Record<string, string>);
      setBuildingClasses(classes as Record<string, string>);
      setCpi(cpiData as CpiData);

      const prices = typedSales['ALL']?.residentialPrices ?? [];
      const firstDate = prices[0]?.date ?? 0;

      const graphState = parseGraphState(window.location.search);
      if (graphState.kind === 'area') {
        setSelectedId(graphState.area);
        if (graphState.hover) setHoveredId(graphState.hover);
        setSelectedDate(firstDate);
      } else if (graphState.kind === 'date') {
        setSelectedDate(graphState.date);
      } else {
        setSelectedDate(firstDate);
      }

      setLoading(false);
    });
  }, []);

  // URL sync
  useEffect(() => {
    if (!salesData) return;
    if (!selectedId) {
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }
    const qs = serializeGraphState({
      kind: 'area',
      area: selectedId,
      hover: hoveredId ?? undefined,
    });
    window.history.replaceState(null, '', `?${qs}`);
  }, [selectedId, hoveredId, salesData]);

  useEffect(() => {
    if (!salesData || selectedDate === 0) return;
    const current = parseGraphState(window.location.search);
    if (current.kind !== 'area') {
      window.history.replaceState(
        null,
        '',
        `?${serializeGraphState({ kind: 'date', date: selectedDate })}`,
      );
    }
  }, [selectedDate, salesData]);

  const dates = useMemo(
    () => salesData?.['ALL']?.residentialPrices?.map((d) => d.date) ?? [],
    [salesData],
  );

  const colorData: ColorDatum[] = useMemo(() => {
    if (!salesData) return [];
    const result: ColorDatum[] = [];
    for (const [id, data] of Object.entries(salesData)) {
      if (id === 'ALL') continue;
      if (IGNORED_IDS.some((ignored) => id.includes(ignored))) continue;
      const prices = data.residentialPrices ?? [];
      let best: number | null = null;
      for (const pt of prices) {
        if (pt.date <= selectedDate) best = pt.value;
        else break;
      }
      if (best !== null) result.push({ id, value: best });
    }
    return result;
  }, [salesData, selectedDate]);

  const mapColorMax = useMemo(() => {
    if (!salesData) return 1000;
    let max = 0;
    for (const [id, data] of Object.entries(salesData)) {
      if (id === 'ALL') continue;
      for (const pt of data.residentialPrices ?? []) {
        if (pt.value > max) max = pt.value;
      }
    }
    return max;
  }, [salesData]);

  const lineData: LineGraphData = useMemo(() => {
    if (!salesData || !selectedId) return {};
    // The `-median` key routes to the ALL (borough) dataset in the line chart;
    // it is sourced from ALL.residentialPrices (the borough-wide pooled median).
    const borough = salesData['ALL']?.residentialPrices ?? [];
    const neighborhood = salesData[selectedId]?.residentialPrices ?? [];

    const transform = (points: DataPoint[]): DataPoint[] => {
      if (priceView === 'indexed') return indexToBase(points);
      if (priceView === 'real' && cpi) return points.map(makeDeflator(cpi));
      return points;
    };

    const result: LineGraphData = {
      ALL: { 'residentialPrices-median': transform(borough) },
    };
    result[selectedId] = { residentialPrices: transform(neighborhood) };
    return result;
  }, [salesData, selectedId, priceView, cpi]);

  const areaData = useMemo(
    () =>
      selectedId
        ? ((salesData?.[selectedId]?.buildingClass ??
            salesData?.['ALL']?.buildingClass ??
            {}) as unknown as AreaData)
        : null,
    [salesData, selectedId],
  );

  const formatHoverText = useCallback(
    (id: string) => {
      const name = formatName(neighborhoodNames[id]) ?? id;
      const datum = colorData.find((d) => d.id === id);
      return datum ? `${name} — $${Math.round(datum.value)}/sqft` : name;
    },
    [neighborhoodNames, colorData],
  );

  const selectedName = selectedId
    ? (formatName(neighborhoodNames[selectedId]) ?? selectedId)
    : null;

  // First/last year of the quarterly axis, derived from the data so the page
  // copy tracks the dataset instead of hardcoding a range that drifts on refresh.
  const coverage = useMemo(() => {
    const prices = salesData?.['ALL']?.residentialPrices ?? [];
    if (prices.length === 0) return { firstYear: 2016, lastYear: 2016 };
    return {
      firstYear: new Date(prices[0].date).getFullYear(),
      lastYear: new Date(prices[prices.length - 1].date).getFullYear(),
    };
  }, [salesData]);

  const scatterData = useMemo(() => {
    if (!salesData) return [];
    const names = Object.fromEntries(
      Object.entries(neighborhoodNames).map(([id, n]) => [id, formatName(n) ?? id]),
    );
    return computeGrowthScatter(salesData, { names, ignoredIds: IGNORED_IDS });
  }, [salesData, neighborhoodNames]);

  if (loading || !topology || !salesData) {
    return (
      <div id="brooklyn" className="map-app">
        <p style={{ padding: '2rem' }}>Loading Brooklyn data…</p>
      </div>
    );
  }

  return (
    <div id="brooklyn" className="map-app">
      <header>
        <div className="heading">Brooklyn Residential Sales 2016–2025</div>
        <div className="border" />
      </header>

      <div className="map-row">
        <div className="map-svg-container">
          <SvgMap
            topology={topology as Parameters<typeof SvgMap>[0]['topology']}
            objectKey="neighborhoods"
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            scale={1.07}
            translateX={37}
            translateY={0}
            ignoredIds={IGNORED_IDS}
            colorData={colorData}
            colorMin={0}
            colorMax={mapColorMax}
            selectedId={selectedId}
            hoveredId={hoveredId ?? undefined}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            title="Median Price per SQFT"
            formatHoverText={formatHoverText}
            colorPalette="spectral"
          />

          <DateSlider
            dates={dates}
            value={selectedDate}
            onChange={setSelectedDate}
            width={SLIDER_WIDTH}
          />
        </div>

        <div className="svg-graphs">
          <p className="graph-help-text">
            Click on a neighborhood like &ldquo;Williamsburg&rdquo; to see how the housing market
            has changed since {coverage.firstYear}.
          </p>
          {selectedId && selectedName && areaData && (
            <div className="svg-graphs-content">
              <a className="back" onClick={() => setSelectedId(null)} style={{ cursor: 'pointer' }}>
                ← BACK TO OVERVIEW
              </a>
              <div className="graph-heading-container">
                <div className="selected-neighborhood-name">
                  <span className="circle-key blue" />
                  <span className="graph-heading">{selectedName}</span>
                </div>
                <div className="avg-neighborhood-name">
                  <span className="circle-key gray" />
                  <span className="graph-heading">Borough Median</span>
                </div>
              </div>

              <div className="price-view-toggle" role="group" aria-label="Price view">
                {PRICE_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    className={priceView === view.id ? 'active' : undefined}
                    aria-pressed={priceView === view.id}
                    onClick={() => setPriceView(view.id)}
                  >
                    {view.label}
                  </button>
                ))}
              </div>

              <LineGraph
                data={lineData}
                keys={['residentialPrices', 'residentialPrices-median']}
                startingDataset={selectedId}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                label={
                  priceView === 'indexed'
                    ? 'Median Price per Sqft (start = 100)'
                    : priceView === 'real'
                      ? 'Median Price per Sqft (constant 2025 $)'
                      : 'Median Price per Sqft'
                }
                yAxisFormat={(v) => (priceView === 'indexed' ? `${v}` : `$${v}`)}
                showTooltips
              />

              <AreaChart
                data={areaData}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                label="Building Class as % of sales"
                keyLabel={(abbrev) => buildingClasses[abbrev] ?? abbrev}
                showTooltips
              />
            </div>
          )}
        </div>
      </div>
      {/* end .map-row */}

      <div className="markdown-text">
        <h1>How Residential Property Sales can help us better understand changes in Brooklyn</h1>
        <p>
          Brooklyn has seen dramatic changes in its housing market. This visualization explores
          property sales from {coverage.firstYear} to {coverage.lastYear}, charting shifts in price
          per square foot across all neighborhoods.
        </p>
        <p>
          Click any neighborhood on the map to see its price history compared to the borough median.
          The building-class chart below shows the mix of property types as a share of total sales.
        </p>

        <h2>The cheapest neighborhoods grew the fastest</h2>
        <p>
          Plotting each neighborhood&rsquo;s current price against its growth since{' '}
          {coverage.firstYear} reveals an inverse relationship: the most affordable areas saw the
          steepest gains, while the priciest ones have largely plateaued. South Williamsburg more
          than doubled (+136%) and several East New York and East Flatbush areas climbed ~80%, all
          from low bases. Meanwhile Brooklyn Heights — already the most expensive at roughly
          $1,390/sqft — rose only ~8%. Hollow dots mark neighborhoods with thin sales coverage (e.g.
          Spring Creek-Starrett City, ~27 of 40 quarters, mostly co-ops that don&rsquo;t report
          square footage), where the trend is less reliable. Hover any dot for its figures, or click
          to load it on the map above.
        </p>
        <div className="scatter-container">
          <ScatterChart
            data={scatterData}
            width={580}
            height={360}
            xLabel="Current median $/sqft"
            yLabel={`Growth since ${coverage.firstYear}`}
            onSelect={setSelectedId}
          />
        </div>
        <p>
          Data comes from the NYC Department of Finance{' '}
          <a
            href="https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu"
            target="_blank"
            rel="noreferrer"
          >
            Citywide Annualized Calendar Sales
          </a>{' '}
          dataset on NYC Open Data, refreshed automatically. Neighborhoods use the 2020 Census
          Neighborhood Tabulation Areas. (The original 2015 edition covered 2003–2014.)
        </p>
      </div>
    </div>
  );
}
