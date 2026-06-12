/**
 * NorthCarolina — React island for the gerrymandering visualization page.
 *
 * Ports apps/north-carolina/ (Backbone + D3 v3) to a typed React + D3 v7 island.
 * URL contract: ?area=official-2012|splitline|brian  ?hover=<districtId>
 */
'use client';
import { scaleQuantile } from 'd3';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SvgMap, type SvgMapProps } from '@/components/SvgMap';
import { parseGraphState, serializeGraphState } from '@/lib/url-state';
import type { ColorDatum, NCCensusTract } from '@/types';

// Legacy svg-map color0–color8 palette (Spectral, blue→red for low→high)
const CIRCLE_COLORS = [
  '#3288bd',
  '#66c2a5',
  '#abdda4',
  '#e6f598',
  '#ffffbf',
  '#fee08b',
  '#fdae61',
  '#f46d43',
  '#d53e4f',
] as const;

type SvgMapTopology = SvgMapProps['topology'];

type MapType = 'official-2012' | 'splitline' | 'brian';
type MetricKey =
  | 'white'
  | 'black'
  | 'republican'
  | 'democrat'
  | 'bachelors'
  | 'poverty'
  | 'veteran'
  | 'employed'
  | 'unemployed';

const METRICS: MetricKey[] = [
  'white',
  'black',
  'republican',
  'democrat',
  'bachelors',
  'poverty',
  'veteran',
  'employed',
  'unemployed',
];

const METRIC_LABELS: Record<MetricKey, string> = {
  white: 'White',
  black: 'Black',
  republican: 'Republican',
  democrat: 'Democrat',
  bachelors: "Bachelor's degree",
  poverty: 'Below poverty line',
  veteran: 'Veterans',
  employed: 'Employed',
  unemployed: 'Unemployed',
};

/** Percentage-based metrics (need normalization by pop). Vote share already 0–100. */
const POP_NORMALIZED: Set<MetricKey> = new Set([
  'white',
  'black',
  'bachelors',
  'poverty',
  'veteran',
  'employed',
  'unemployed',
]);

/** Parse CPVI string like "d+16" or "r+11" into a numeric lean. */
function parseCpvi(cpvi: string): { party: 'D' | 'R'; lean: number } {
  const match = cpvi.match(/^([dr])\+(\d+)$/i);
  if (!match) return { party: 'R', lean: 0 };
  return {
    party: match[1].toUpperCase() as 'D' | 'R',
    lean: parseInt(match[2], 10),
  };
}

/** Aggregate census tracts by district. Returns { districtId → { metric → value } }. */
function aggregateByDistrict(tracts: NCCensusTract[]): Map<string, Record<string, number>> {
  const sums = new Map<string, Record<string, number> & { _pop: number }>();

  for (const tract of tracts) {
    const d = tract.district;
    if (!sums.has(d)) {
      sums.set(d, {
        _pop: 0,
        white: 0,
        black: 0,
        bachelors: 0,
        poverty: 0,
        veteran: 0,
        employed: 0,
        unemployed: 0,
        democrat: 0,
        republican: 0,
      });
    }
    const row = sums.get(d)!;
    row._pop += tract.pop;
    for (const key of METRICS) {
      row[key] += (tract[key] as number) ?? 0;
    }
  }

  const result = new Map<string, Record<string, number>>();
  for (const [districtId, row] of sums) {
    const normalized: Record<string, number> = {};
    for (const key of METRICS) {
      if (POP_NORMALIZED.has(key)) {
        normalized[key] = row._pop > 0 ? (row[key] / row._pop) * 100 : 0;
      } else {
        // democrat / republican are already vote-share percentages averaged per tract;
        // take a weighted average.
        normalized[key] = row._pop > 0 ? row[key] / (sums.get(districtId)?._pop ?? 1) : 0;
      }
    }
    result.set(districtId, normalized);
  }
  return result;
}

// TopoJSON topology type (opaque from topojson-client perspective)
type Topology = object;

const NC_ROTATE: [number, number] = [80, 0];
const DEFAULT_DISTRICT = '12'; // NC-12 — historically the most-gerrymandered district; pre-selected on load

export function NorthCarolina() {
  const [topoOfficial, setTopoOfficial] = useState<Topology | null>(null);
  const [topoSplitline, setTopoSplitline] = useState<Topology | null>(null);
  const [tracts, setTracts] = useState<NCCensusTract[]>([]);
  const [cpvi, setCpvi] = useState<Record<string, string>>({});
  const [mapType, setMapType] = useState<MapType>('official-2012');
  const [metric, setMetric] = useState<MetricKey>('white');
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_DISTRICT);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    const base = '/data/north-carolina';
    Promise.all([
      fetch(`${base}/north-carolina-2012-districts.json`).then((r) => r.json()),
      fetch(`${base}/shortest-splitline.json`).then((r) => r.json()),
      fetch(`${base}/display-data.json`).then((r) => r.json()),
      fetch(`${base}/cpvi.json`).then((r) => r.json()),
    ])
      .then(([official, splitline, displayData, cpviData]) => {
        setTopoOfficial(official as Topology);
        setTopoSplitline(splitline as Topology);
        setTracts(displayData as NCCensusTract[]);
        setCpvi(cpviData as Record<string, string>);
      })
      .finally(() => setLoading(false));
  }, []);

  // Parse URL state on mount
  useEffect(() => {
    const state = parseGraphState(window.location.search);
    if (state.kind === 'area') {
      const area = state.area as MapType;
      if (area === 'official-2012' || area === 'splitline' || area === 'brian') {
        setMapType(area);
      }
      if (state.hover) setSelectedId(state.hover);
    }
  }, []);

  // Push URL state when mapType or selectedId changes
  useEffect(() => {
    const qs = serializeGraphState(
      selectedId
        ? { kind: 'area', area: mapType, hover: selectedId }
        : { kind: 'area', area: mapType },
    );
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [mapType, selectedId]);

  // Aggregate tracts by district
  const districtData = useMemo(() => aggregateByDistrict(tracts), [tracts]);

  // Build colorData for the current metric
  const colorData = useMemo<ColorDatum[]>(() => {
    const entries: ColorDatum[] = [];
    for (const [districtId, values] of districtData) {
      entries.push({ id: districtId, value: values[metric] ?? 0 });
    }
    return entries;
  }, [districtData, metric]);

  // Sorted district ids for bar chart
  const sortedDistricts = useMemo(
    () =>
      [...districtData.keys()].sort((a, b) => {
        const va = districtData.get(a)?.[metric] ?? 0;
        const vb = districtData.get(b)?.[metric] ?? 0;
        return vb - va;
      }),
    [districtData, metric],
  );

  const activeTopology = mapType === 'splitline' ? topoSplitline : topoOfficial;

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleMapType = useCallback((type: MapType) => {
    setMapType(type);
    setSelectedId(null);
  }, []);

  const maxVal = useMemo(
    () => Math.max(...[...districtData.values()].map((v) => v[metric] ?? 0), 1),
    [districtData, metric],
  );

  // Per-tract metric value (normalized) + quantile fill color for overlay circles
  const tractCircleData = useMemo(() => {
    if (!tracts.length) return [];
    const vals = tracts.map((t) => {
      const raw = (t[metric] as number) ?? 0;
      return POP_NORMALIZED.has(metric) ? (t.pop > 0 ? (raw / t.pop) * 100 : 0) : raw;
    });
    const colorScale = scaleQuantile<string>()
      .domain(vals)
      .range([...CIRCLE_COLORS]);
    return tracts.map((t, i) => ({ tract: t, fill: colorScale(vals[i]!) }));
  }, [tracts, metric]);

  if (loading) {
    return (
      <div className="nc-loading">
        <p>Loading North Carolina data…</p>
      </div>
    );
  }

  return (
    <div className="map-app nc-page">
      {/* Shared page header (centered serif heading + rule), matching the other map pages */}
      <header>
        <div className="heading">Gerrymandering in North Carolina</div>
        <div className="border" />
      </header>

      {/* Map type selector */}
      <nav className="nc-map-type">
        <span className="nc-map-type-label">Ways to draw districts: </span>
        {(['official-2012', 'splitline', 'brian'] as MapType[]).map((type, i) => (
          <span key={type}>
            {i > 0 && <span className="nc-sep"> | </span>}
            <button
              className={`nc-map-link faux-underline-hover${mapType === type ? ' nc-map-link--active' : ''}`}
              onClick={() => handleMapType(type)}
            >
              {type}
            </button>
          </span>
        ))}
      </nav>

      <div className="nc-main">
        {/* Left: map + metric selector */}
        <div className="nc-map-col">
          {mapType === 'brian' ? (
            <div className="nc-brian-unavailable">
              <p>
                The Brian Olsen district map is not available. No data file exists for this map
                type.
              </p>
            </div>
          ) : activeTopology ? (
            <SvgMap
              topology={activeTopology as SvgMapTopology}
              objectKey="districts"
              width={500}
              height={600}
              rotate={NC_ROTATE}
              scale={2}
              translateX={280}
              translateY={-100}
              colorData={colorData}
              colorMin={0}
              colorMax={100}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={handleHover}
              zoomOnClick={false}
              reverseColorKey={false}
              title={METRIC_LABELS[metric]}
              formatHoverText={(id) => {
                const val = districtData.get(id)?.[metric] ?? 0;
                const cpviStr = cpvi[id] ?? '';
                return `District ${id}: ${val.toFixed(1)}% ${cpviStr ? `(${cpviStr.toUpperCase()})` : ''}`;
              }}
            >
              {(projection) =>
                tractCircleData.map(({ tract, fill }) => {
                  const xy = projection(tract.point as [number, number]);
                  return xy ? (
                    <circle
                      key={tract.id}
                      cx={xy[0]}
                      cy={xy[1]}
                      r={2}
                      fill={fill}
                      style={{ pointerEvents: 'none', stroke: 'none' }}
                    />
                  ) : null;
                })
              }
            </SvgMap>
          ) : (
            <p>Map data unavailable.</p>
          )}

          {/* Metric selector */}
          <div className="nc-metrics">
            <span className="nc-metrics-label">Metric: </span>
            {METRICS.map((m, i) => (
              <span key={m}>
                {i > 0 && <span className="nc-sep"> | </span>}
                <button
                  className={`nc-metric-link faux-underline-hover${metric === m ? ' nc-metric-link--active' : ''}`}
                  onClick={() => setMetric(m)}
                >
                  {METRIC_LABELS[m]}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Right: bar chart */}
        <div className="nc-chart-col">
          <h2 className="nc-chart-title">{METRIC_LABELS[metric]} by district</h2>
          <svg
            className="nc-bar-chart"
            width={300}
            height={sortedDistricts.length * 28 + 20}
            role="img"
            aria-label={`Bar chart: ${METRIC_LABELS[metric]} by NC congressional district`}
          >
            {sortedDistricts.map((districtId, i) => {
              const val = districtData.get(districtId)?.[metric] ?? 0;
              const barWidth = Math.max(0, (val / maxVal) * 220);
              const cpviStr = cpvi[districtId] ?? '';
              const { party } = parseCpvi(cpviStr);
              const barColor = party === 'D' ? '#5b8dd9' : '#d95b5b';
              const y = i * 28 + 10;
              return (
                <g
                  key={districtId}
                  className={`nc-bar-group${selectedId === districtId ? ' nc-bar-group--selected' : ''}`}
                  onClick={() => handleSelect(districtId === selectedId ? null : districtId)}
                  style={{ cursor: 'pointer' }}
                >
                  <text x={28} y={y + 13} fontSize={11} textAnchor="end" fill="currentColor">
                    {districtId}
                  </text>
                  <rect
                    x={32}
                    y={y}
                    width={barWidth}
                    height={18}
                    fill={barColor}
                    opacity={selectedId && selectedId !== districtId ? 0.4 : 0.85}
                  />
                  <text x={32 + barWidth + 4} y={y + 13} fontSize={10} fill="currentColor">
                    {val.toFixed(1)}%{cpviStr ? ` (${cpviStr.toUpperCase()})` : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Essay text */}
      <article className="nc-essay">
        <p>
          Gerrymandering is a strange little political practice. It shakes the foundations of
          democracy by allowing some people to intentionally make other people&rsquo;s votes not
          matter. The sad thing about gerrymandering is that both political parties&rsquo; hands are
          dirty &mdash; it is common practice to redraw congressional boundaries in one&rsquo;s
          favor whenever a party gets into power.
        </p>

        <h2>What is Gerrymandering?</h2>
        <p>
          When redistricting happens, existing boundaries are moved to put people who vote for the
          opposing party together into a small number of districts, limiting their influence.
          Gerrymandering works when a party wins the most seats in a state by concentrating the
          other party&rsquo;s voters into a small number of lopsided seats.
        </p>
        <blockquote>
          &ldquo;In North Carolina, where the two-party House vote was 51 percent Democratic, 49
          percent Republican, the average simulated delegation was seven Democrats and six
          Republicans. The actual outcome? Four Democrats, nine Republicans &mdash; a split that
          occurred in less than 1 percent of simulations.&rdquo;
          <br />
          <cite>
            &mdash;{' '}
            <a
              href="http://www.nytimes.com/2013/02/03/opinion/sunday/the-great-gerrymander-of-2012.html"
              className="faux-underline-hover"
            >
              Sam Wang, NYTimes
            </a>
          </cite>
        </blockquote>

        <h2>What is a &ldquo;fair&rdquo; congressional district?</h2>
        <p>
          Perhaps what makes drawing congressional districts so difficult is that it is hard to
          agree on what creates a &ldquo;fair&rdquo; district. The broad metric is that every
          person&rsquo;s vote should be equal. No group should have more or less power through how
          their voting district is drawn. The maps above let you compare the official 2012 North
          Carolina districts against a &ldquo;splitline&rdquo; algorithmic approach that draws
          districts using only population equality as a constraint.
        </p>

        <h2>Why Now?</h2>
        <p>
          I genuinely believe computers should be drawing our district lines, but I am well aware of
          the problems of having computers solve problems that humans can&rsquo;t agree on. Instead
          of redrawing districts after every election, computer-controlled districting would simply
          update as the population changes over time. While automated districting certainly has some
          bias, it is an intriguing solution since it is &ldquo;less bad&rdquo; on many levels and
          less susceptible to corruption.
        </p>
      </article>
    </div>
  );
}
