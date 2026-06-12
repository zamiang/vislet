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
import { SvgMap } from '@/components/SvgMap';
import type { AreaData } from '@/lib/area-chart';
import { formatName } from '@/lib/format';
import type { LineGraphData } from '@/lib/line-chart';
import { parseGraphState, serializeGraphState } from '@/lib/url-state';
import type { BrooklynData, ColorDatum, DataPoint } from '@/types';

const MAP_WIDTH = 500;
const MAP_HEIGHT = 400;
const CHART_WIDTH = 490;
const CHART_HEIGHT = 230;
const SLIDER_WIDTH = 502;
const IGNORED_IDS = ['99', '98'];

export function Brooklyn() {
  const [salesData, setSalesData] = useState<BrooklynData | null>(null);
  const [topology, setTopology] = useState<unknown>(null);
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({});
  const [buildingClasses, setBuildingClasses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      fetch('/data/brooklyn/brooklyn-sales-display-data.json').then((r) => r.json()),
      fetch('/data/brooklyn/brooklyn.json').then((r) => r.json()),
      fetch('/data/brooklyn/nyc-neighborhood-names.json').then((r) => r.json()),
      fetch('/data/brooklyn/building-class.json').then((r) => r.json()),
    ]).then(([sales, topo, names, classes]) => {
      const typedSales = sales as BrooklynData;
      setSalesData(typedSales);
      setTopology(topo);
      setNeighborhoodNames(names as Record<string, string>);
      setBuildingClasses(classes as Record<string, string>);

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
    const result: Record<string, Record<string, DataPoint[]>> = {
      ALL: { 'residentialPrices-mean': salesData['ALL']?.['residentialPrices-mean'] ?? [] },
    };
    result[selectedId] = { residentialPrices: salesData[selectedId]?.residentialPrices ?? [] };
    return result;
  }, [salesData, selectedId]);

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

  const selectedName = selectedId ? (formatName(neighborhoodNames[selectedId]) ?? selectedId) : null;

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
        <div className="heading">Brooklyn Residential Sales 2003–2014</div>
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
            title="Avg Price per SQFT"
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
            has changed since 2003.
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
                  <span className="graph-heading">Borough Average</span>
                </div>
              </div>

              <LineGraph
                data={lineData}
                keys={['residentialPrices', 'residentialPrices-mean']}
                startingDataset={selectedId}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                label="Avg Price per Sqft"
                yAxisFormat={(v) => `$${v}`}
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
        <time dateTime="2014-01-12">January 12, 2015</time>
        <h1>How Residential Property Sales can help us better understand changes in Brooklyn</h1>
        <p>
          Brooklyn has seen dramatic changes in its housing market over the last decade. This
          visualization explores 322,056 residential property sales from 2003 to 2014, charting
          shifts in price per square foot across all neighborhoods.
        </p>
        <p>
          Click any neighborhood on the map to see its price history compared to the borough
          average. The building-class chart below shows the mix of property types as a share of
          total sales.
        </p>
      </div>
    </div>
  );
}
