'use client';
/**
 * Chicago Crime page — React island for the Astro page at /chicago.
 *
 * Ports apps/chicago/client/index.coffee + select/slider/svg-map wiring.
 * D3 owns math (scales, path, color quantile); React owns every DOM node.
 * URL deep-link contract: ?area=<id> ?hover=<id> ?type=<abbrev> ?date=<epochMs>
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AreaChart } from '@/components/AreaChart';
import { DateSlider } from '@/components/DateSlider';
import { LineGraph } from '@/components/LineGraph';
import { Select } from '@/components/Select';
import { SvgMap } from '@/components/SvgMap';
import type { AreaData } from '@/lib/area-chart';
import type { LineGraphData } from '@/lib/line-chart';
import { parseGraphState, serializeGraphState } from '@/lib/url-state';
import type { ChicagoData, ColorDatum } from '@/types';

// ─── constants ───────────────────────────────────────────────────────────────

const DEFAULT_SELECTED_ID = '68';
const MAP_WIDTH = 500;
const MAP_HEIGHT = 400;
const GRAPH_WIDTH = 450;
const GRAPH_HEIGHT = 120;
const CHICAGO_ROTATE: [number, number] = [74 + 800 / 60, -38 - 50 / 60]; // [87.333, -39.833]
const IGNORED_IDS = ['33', '20'];

// ─── types ───────────────────────────────────────────────────────────────────

type Topology = Record<string, unknown>;

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Find the value in a DataPoint[] closest to the given epoch ms. */
function valueAtDate(points: { date: number; value: number }[], targetDate: number): number {
  if (!points.length) return 0;
  let closest = points[0]!;
  let minDiff = Math.abs(closest.date - targetDate);
  for (const p of points) {
    const diff = Math.abs(p.date - targetDate);
    if (diff < minDiff) {
      minDiff = diff;
      closest = p;
    }
  }
  return closest.value;
}

/**
 * Build ColorDatum[] for the choropleth. When selectedType === 'ALL', value is
 * the crime tally at selectedDate. When a specific crime type is selected, value
 * is the sum of that type's series for the neighborhood.
 */
function buildColorData(
  crimeData: ChicagoData,
  selectedType: string,
  selectedDate: number,
  ignoredIds: string[],
): ColorDatum[] {
  return Object.entries(crimeData)
    .filter(([id]) => id !== 'ALL' && !ignoredIds.includes(id))
    .map(([id, d]) => {
      let value: number;
      if (selectedType === 'ALL') {
        value = valueAtDate(d.crimeTally, selectedDate);
      } else {
        const series = d.crimeType[selectedType];
        if (!series) {
          value = 0;
        } else {
          value = (series as { date: number; value: number }[]).reduce(
            (sum, p) => sum + p.value,
            0,
          );
        }
      }
      return { id, value };
    });
}

/** Build LineGraphData for selected + city-average lines. */
function buildLineData(
  crimeData: ChicagoData,
  selectedId: string,
  hoveredId: string | null,
): LineGraphData {
  const allData = crimeData['ALL'];
  const result: LineGraphData = {
    ALL: { 'crimeTally-mean': allData?.['crimeTally-mean'] ?? [] },
    [selectedId]: { crimeTally: crimeData[selectedId]?.crimeTally ?? [] },
  };
  if (hoveredId && hoveredId !== selectedId) {
    result[hoveredId] = { crimeTally: crimeData[hoveredId]?.crimeTally ?? [] };
  }
  return result;
}

/** Extract sorted unique dates from the ALL crimeTally series. */
function extractDates(crimeData: ChicagoData): number[] {
  return (crimeData['ALL']?.crimeTally ?? []).map((p) => p.date).sort((a, b) => a - b);
}

/**
 * Invert crime-types.json { full_name → abbrev } to { abbrev → full_name }.
 * Only include abbrevs that appear in the ALL crimeType data.
 */
function buildCrimeTypeOptions(
  crimeTypesRaw: Record<string, string>,
  crimeData: ChicagoData,
): Record<string, string> {
  const available = new Set(Object.keys(crimeData['ALL']?.crimeType ?? {}));
  const inverted: Record<string, string> = {};
  for (const [fullName, abbrev] of Object.entries(crimeTypesRaw)) {
    if (available.has(abbrev)) {
      inverted[abbrev] = fullName;
    }
  }
  return inverted;
}

// ─── component ───────────────────────────────────────────────────────────────

export function Chicago() {
  const [topology, setTopology] = useState<Topology | null>(null);
  const [crimeData, setCrimeData] = useState<ChicagoData | null>(null);
  const [crimeTypeOptions, setCrimeTypeOptions] = useState<Record<string, string>>({});
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_SELECTED_ID);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<number>(0);

  // ── fetch all data on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      const [topoRes, crimeRes, crimeTypesRes, namesRes] = await Promise.all([
        fetch('/data/chicago/neighborhoods.json'),
        fetch('/data/chicago/chicago-crimes-display-data.json'),
        fetch('/data/chicago/crime-types.json'),
        fetch('/data/chicago/neighborhood-names.json'),
      ]);

      const [topo, crime, crimeTypes, names] = await Promise.all([
        topoRes.json() as Promise<Topology>,
        crimeRes.json() as Promise<ChicagoData>,
        crimeTypesRes.json() as Promise<Record<string, string>>,
        namesRes.json() as Promise<Record<string, string>>,
      ]);

      setTopology(topo);
      setCrimeData(crime);
      setCrimeTypeOptions(buildCrimeTypeOptions(crimeTypes, crime));
      setNeighborhoodNames(names);

      // default selectedDate = last date in ALL crimeTally
      const dates = (crime['ALL']?.crimeTally ?? []).map((p) => p.date).sort((a, b) => a - b);
      const lastDate = dates[dates.length - 1] ?? 0;
      setSelectedDate(lastDate);

      setLoading(false);
    }
    void fetchAll();
  }, []);

  // ── parse URL on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const state = parseGraphState(window.location.search);
    if (state.kind === 'area') {
      setSelectedId(state.area);
      if (state.hover) setHoveredId(state.hover);
    } else if (state.kind === 'type') {
      setSelectedType(state.type);
      setSelectedId(null);
    } else if (state.kind === 'date') {
      setSelectedDate(state.date);
      setSelectedId(null);
    }
    // overview: keep defaults
  }, []);

  // ── sync URL on state changes ────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    let qs: string;
    if (selectedId) {
      const gs = hoveredId
        ? { kind: 'area' as const, area: selectedId, hover: hoveredId }
        : { kind: 'area' as const, area: selectedId };
      qs = serializeGraphState(gs);
    } else if (selectedType !== 'ALL') {
      qs = serializeGraphState({ kind: 'type', type: selectedType });
    } else if (selectedDate) {
      qs = serializeGraphState({ kind: 'date', date: selectedDate });
    } else {
      qs = serializeGraphState({ kind: 'overview' });
    }
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [selectedId, hoveredId, selectedType, selectedDate, loading]);

  // ── derived data ─────────────────────────────────────────────────────────

  const sliderDates = useMemo(() => (crimeData ? extractDates(crimeData) : []), [crimeData]);

  const colorData = useMemo<ColorDatum[]>(() => {
    if (!crimeData) return [];
    return buildColorData(crimeData, selectedType, selectedDate, IGNORED_IDS);
  }, [crimeData, selectedType, selectedDate]);

  const lineData = useMemo<LineGraphData | null>(() => {
    if (!crimeData || !selectedId) return null;
    return buildLineData(crimeData, selectedId, hoveredId);
  }, [crimeData, selectedId, hoveredId]);

  const areaData = useMemo<AreaData | null>(() => {
    if (!crimeData || !selectedId) return null;
    const crimeType = crimeData[selectedId]?.crimeType;
    if (!crimeType) return null;
    // crimeType = { abbrev → DataPoint[] } (array, not object map)
    // AreaData = Record<series_name, Record<time_key, AreaInputPoint>>
    // Convert each abbrev's array to a Record<string, AreaInputPoint>
    const result: AreaData = {};
    for (const [abbrev, points] of Object.entries(crimeType)) {
      const pointMap: Record<string, { date: number; value: number }> = {};
      for (let i = 0; i < (points as { date: number; value: number }[]).length; i++) {
        pointMap[String(i)] = (points as { date: number; value: number }[])[i]!;
      }
      result[abbrev] = pointMap;
    }
    return result;
  }, [crimeData, selectedId]);

  // ── event handlers ───────────────────────────────────────────────────────

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (!id) setHoveredId(null);
  }, []);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

  const handleDateChange = useCallback((date: number) => {
    setSelectedDate(date);
  }, []);

  // ── formatters ───────────────────────────────────────────────────────────

  const formatHoverText = useCallback(
    (id: string) => neighborhoodNames[id] ?? id,
    [neighborhoodNames],
  );

  const lineKeyLabel = useCallback(
    (idOrName: string) => {
      if (idOrName === 'Borough Average') return 'City Average';
      return neighborhoodNames[idOrName] ?? idOrName;
    },
    [neighborhoodNames],
  );

  const areaKeyLabel = useCallback(
    (name: string) => crimeTypeOptions[name] ?? name,
    [crimeTypeOptions],
  );

  // ── render ───────────────────────────────────────────────────────────────

  const activeNeighborhoodName = selectedId ? (neighborhoodNames[selectedId] ?? selectedId) : null;

  if (loading || !topology || !crimeData) {
    return <div className="map-app">Loading...</div>;
  }

  return (
    <div className="map-app">
      <header className="map-header">
        <h1 className="map-title">Chicago Crime 2003–2014</h1>
        <p className="map-description">
          5,712,201 crimes shown across Chicago neighborhoods from 2003 to 2014.
        </p>
        <div className="map-controls">
          <Select
            id="crime-type-select"
            options={crimeTypeOptions}
            value={selectedType}
            onChange={handleTypeChange}
            includeAll
          />
        </div>
      </header>

      <div className="map-row">
      <div className="map-svg-container">
        <SvgMap
          topology={topology as unknown as Parameters<typeof SvgMap>[0]['topology']}
          objectKey="neighborhoods"
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          rotate={CHICAGO_ROTATE}
          scale={0.93}
          translateX={3}
          translateY={0}
          ignoredIds={IGNORED_IDS}
          colorData={colorData}
          colorMin={0}
          colorMax={40}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={handleSelect}
          onHover={handleHover}
          title="Crime Rate per 1,000 Residents"
          formatHoverText={formatHoverText}
          reverseColorKey
          zoomOnClick
        />

        {selectedType === 'ALL' && sliderDates.length > 0 && (
          <DateSlider
            id="chicago-date-slider"
            dates={sliderDates}
            value={selectedDate}
            onChange={handleDateChange}
            width={MAP_WIDTH}
          />
        )}
      </div>

      {selectedId && lineData && (
        <div className="svg-graphs">
          <div className="graph-header">
            <h2 className="graph-title">{activeNeighborhoodName}</h2>
            <button className="graph-back" onClick={() => handleSelect(null)} type="button">
              Back to overview
            </button>
          </div>

          <div className="graph-row">
            <LineGraph
              data={lineData}
              keys={['crimeTally', 'crimeTally-mean']}
              startingDataset={selectedId}
              width={GRAPH_WIDTH}
              height={GRAPH_HEIGHT}
              label="Crime Tally"
              keyLabel={lineKeyLabel}
              showTooltips
            />
          </div>

          {areaData && (
            <div className="graph-row">
              <AreaChart
                data={areaData}
                width={GRAPH_WIDTH}
                height={GRAPH_HEIGHT}
                label="Crime Type Breakdown"
                keyLabel={areaKeyLabel}
                showTooltips
              />
            </div>
          )}
        </div>
      )}
      </div>{/* end .map-row */}
    </div>
  );
}
