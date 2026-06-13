/**
 * NYC 311 page component — typed React + D3 v7 port of `apps/311/`.
 *
 * Fetches data lazily from /public/data/311/ on mount; no data bundled.
 * URL deep-link contract: ?area=<id> ?hover=<id> ?type=<abbrev> ?date=<ms>
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AreaChart } from '@/components/AreaChart';
import { DateSlider } from '@/components/DateSlider';
import { LineGraph } from '@/components/LineGraph';
import { Select } from '@/components/Select';
import { SvgMap } from '@/components/SvgMap';
import type { AreaData } from '@/lib/area-chart';
import { formatName } from '@/lib/format';
import type { LineGraphData } from '@/lib/line-chart';
import { parseGraphState, serializeGraphState } from '@/lib/url-state';
import type { ColorDatum, DataPoint, ThreeOneOneData } from '@/types';

const DEFAULT_AREA = 'BK0802'; // Crown Heights (North) (2020 NTA)
// Breakdown series excluded from the stacked chart (legacy 311 `ignoredIds`).
// `heat` (heating) is a massive outlier (peaks ~330 vs ~22 for the rest) that
// would otherwise dominate the whole stack; `rode` (rodent) is also dropped.
const AREA_IGNORED_IDS = ['rode', 'heat'];
const MAP_WIDTH = 500;
const MAP_HEIGHT = 400;
const CHART_WIDTH = 490;
const CHART_HEIGHT = 230;
const SLIDER_WIDTH = 502;
const IGNORED_IDS = ['99', '98'];

export function ThreeOneOne() {
  const [data, setData] = useState<ThreeOneOneData | null>(null);
  const [complaintTypes, setComplaintTypes] = useState<Record<string, string>>({});
  const [topology, setTopology] = useState<unknown>(null);
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<{ totalComplaints: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string>(DEFAULT_AREA);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      fetch('/data/311/display-data.json').then((r) => r.json()),
      fetch('/data/311/complaint-types.json').then((r) => r.json()),
      fetch('/data/311/nyc.json').then((r) => r.json()),
      fetch('/data/311/nyc-neighborhood-names.json').then((r) => r.json()),
      // Coverage sidecar (absolute count for the copy); tolerate its absence.
      fetch('/data/311/meta.json')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([displayData, typesRaw, topo, names, metaRaw]) => {
      const typedData = displayData as ThreeOneOneData;
      // complaint-types.json = { label: abbrev } — invert to { abbrev: label }
      const typesInverted = Object.fromEntries(
        Object.entries(typesRaw as Record<string, string>).map(([label, abbrev]) => [
          abbrev,
          label,
        ]),
      );
      setData(typedData);
      setComplaintTypes(typesInverted);
      setTopology(topo);
      setNeighborhoodNames(names as Record<string, string>);
      setMeta(metaRaw as { totalComplaints: number } | null);

      const tally = typedData['ALL']?.complaintTally ?? [];
      const lastDate = tally[tally.length - 1]?.date ?? 0;

      const graphState = parseGraphState(window.location.search);
      if (graphState.kind === 'area') {
        setSelectedId(graphState.area);
        if (graphState.hover) setHoveredId(graphState.hover);
        setSelectedDate(lastDate);
      } else if (graphState.kind === 'type') {
        setSelectedType(graphState.type);
        setSelectedDate(lastDate);
      } else if (graphState.kind === 'date') {
        setSelectedDate(graphState.date);
      } else {
        setSelectedDate(lastDate);
      }

      setLoading(false);
    });
  }, []);

  const pushUrl = useCallback((qs: string) => {
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, []);

  const handleSelect = useCallback(
    (id: string | null) => {
      const next = id ?? DEFAULT_AREA;
      setSelectedId(next);
      pushUrl(serializeGraphState({ kind: 'area', area: next }));
    },
    [pushUrl],
  );

  const handleHover = useCallback(
    (id: string | null) => {
      setHoveredId(id);
      if (id) {
        pushUrl(serializeGraphState({ kind: 'area', area: selectedId, hover: id }));
      } else {
        pushUrl(serializeGraphState({ kind: 'area', area: selectedId }));
      }
    },
    [pushUrl, selectedId],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setSelectedType(value);
      if (value === 'ALL') {
        pushUrl('');
      } else {
        pushUrl(serializeGraphState({ kind: 'type', type: value }));
      }
    },
    [pushUrl],
  );

  const handleDateChange = useCallback(
    (date: number) => {
      setSelectedDate(date);
      pushUrl(serializeGraphState({ kind: 'date', date }));
    },
    [pushUrl],
  );

  const allDates = useMemo(
    () => (data?.['ALL']?.complaintTally ?? []).map((d) => d.date).sort((a, b) => a - b),
    [data],
  );

  const activeDate = useMemo(() => {
    if (!allDates.length) return 0;
    if (!selectedDate) return allDates[allDates.length - 1] ?? 0;
    return allDates.reduce((prev, cur) =>
      Math.abs(cur - selectedDate) < Math.abs(prev - selectedDate) ? cur : prev,
    );
  }, [allDates, selectedDate]);

  const colorData: ColorDatum[] = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .filter(([id]) => id !== 'ALL' && !IGNORED_IDS.some((ig) => id.includes(ig)))
      .map(([id, neighborhood]) => {
        const tally = neighborhood.complaintTally ?? [];
        const point = tally.find((p) => p.date === activeDate);
        return { id, value: point?.value ?? 0 };
      });
  }, [data, activeDate]);

  const selectOptions = useMemo(() => {
    if (!data) return {};
    const allTypes = data['ALL']?.complaintType ?? {};
    return Object.fromEntries(
      Object.entries(complaintTypes).filter(([abbrev]) => abbrev in allTypes),
    );
  }, [data, complaintTypes]);

  const lineGraphData: LineGraphData = useMemo(() => {
    if (!data) return {};
    const activeId = selectedId in data ? selectedId : DEFAULT_AREA;
    const result: Record<string, Record<string, DataPoint[]>> = {
      ALL: { 'complaintTally-mean': data['ALL']?.['complaintTally-mean'] ?? [] },
    };
    result[activeId] = { complaintTally: data[activeId]?.complaintTally ?? [] };
    return result;
  }, [data, selectedId]);

  const areaData = useMemo(() => {
    if (!data) return {} as AreaData;
    const activeId = selectedId in data ? selectedId : DEFAULT_AREA;
    return (data[activeId]?.complaintType ?? {}) as unknown as AreaData;
  }, [data, selectedId]);

  // Fixed complaint-type order (citywide `ALL` keys) so each type keeps the same
  // legend slot and color across neighborhoods; types a neighborhood lacks just
  // render as a zero band instead of shifting everything below them.
  const areaDomain = useMemo(() => {
    const allTypes = data?.['ALL']?.complaintType ?? {};
    return Object.keys(allTypes)
      .sort()
      .filter((name) => !AREA_IGNORED_IDS.includes(name));
  }, [data]);

  const formatHoverText = useCallback(
    (id: string) => {
      const name = neighborhoodNames[id];
      return name ? (formatName(name) ?? name) : id;
    },
    [neighborhoodNames],
  );

  const keyLabel = useCallback(
    (abbrev: string) => complaintTypes[abbrev] ?? abbrev,
    [complaintTypes],
  );

  const activeNeighborhoodName = useMemo(() => {
    const name = neighborhoodNames[selectedId];
    return name ? (formatName(name) ?? name) : selectedId;
  }, [neighborhoodNames, selectedId]);

  // Coverage span derived from the data so the page copy never goes stale on a
  // refresh: first/last year of the citywide monthly axis.
  const coverage = useMemo(() => {
    const tally = data?.['ALL']?.complaintTally ?? [];
    if (tally.length === 0) return { firstYear: 2010, lastYear: 2010 };
    return {
      firstYear: new Date(tally[0].date).getFullYear(),
      lastYear: new Date(tally[tally.length - 1].date).getFullYear(),
    };
  }, [data]);

  if (loading || !topology || !data) {
    return (
      <div id="three" className="map-app">
        <p style={{ padding: '2rem' }}>Loading 311 data…</p>
      </div>
    );
  }

  return (
    <div id="three" className="map-app">
      <header>
        <div className="heading">
          311 Calls in NYC from {coverage.firstYear}–{coverage.lastYear}
        </div>
        <div className="border" />
      </header>

      <div className="map-row">
        <div className="map-svg-container">
          <div className="select-container visible" style={{ marginBottom: '8px' }}>
            <label htmlFor="three-select">Filter 311 reports: </label>
            <Select
              id="three-select"
              options={selectOptions}
              value={selectedType}
              onChange={handleTypeChange}
              includeAll
            />
          </div>

          <SvgMap
            topology={topology as Parameters<typeof SvgMap>[0]['topology']}
            objectKey="neighborhoods"
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            scale={1.3}
            translateX={-50}
            translateY={20}
            ignoredIds={IGNORED_IDS}
            colorData={colorData}
            colorMin={0}
            colorMax={50}
            selectedId={selectedId}
            hoveredId={hoveredId ?? undefined}
            onSelect={handleSelect}
            onHover={handleHover}
            title="311 Reports per 1,000 residents"
            formatHoverText={formatHoverText}
          />

          {allDates.length > 0 && (
            <DateSlider
              id="three-date-slider"
              dates={allDates}
              value={activeDate}
              onChange={handleDateChange}
              width={SLIDER_WIDTH}
            />
          )}
        </div>

        <div className="svg-graphs">
          <p className="graph-help-text">
            Click on a neighborhood to see how the residents use 311.
          </p>
          <div className="svg-graphs-content">
            <div className="graph-heading-container">
              <div className="selected-neighborhood-name">
                <span className="circle-key blue" />
                <span className="graph-heading">{activeNeighborhoodName}</span>
              </div>
              <div className="avg-neighborhood-name">
                <span className="circle-key gray" />
                <span className="graph-heading">Borough Average</span>
              </div>
            </div>

            <LineGraph
              data={lineGraphData}
              keys={['complaintTally', 'complaintTally-mean']}
              startingDataset={selectedId in (data ?? {}) ? selectedId : DEFAULT_AREA}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              label={`311 Calls: ${activeNeighborhoodName}`}
              keyLabel={(key) =>
                key === 'complaintTally-mean' ? 'Borough Average' : activeNeighborhoodName
              }
              showTooltips
            />

            <AreaChart
              data={areaData}
              domain={areaDomain}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              label="Complaint Type Breakdown"
              keyLabel={keyLabel}
              computeYDomain
              yAxisFormat={(v) => String(v)}
              tooltipFormat=""
              showTooltips
            />
          </div>
        </div>
      </div>
      {/* end .map-row */}

      <div className="markdown-text">
        <time dateTime="2015-01-22">January 22, 2015</time>
        <h1>How 311 Data can help us understand NYC</h1>
        <p>
          311 is New York City&rsquo;s non-emergency government services hotline. From noise
          complaints to pothole reports, the{' '}
          {meta ? `${(meta.totalComplaints / 1e6).toFixed(1)} million` : 'millions of'} geocoded
          calls from {coverage.firstYear} to {coverage.lastYear} reveal how residents interact with
          city services across every neighborhood.
        </p>
        <p>
          Click any neighborhood on the map to see its complaint history and breakdown by type,
          compared to the borough average.
        </p>
      </div>
    </div>
  );
}
