/**
 * SvgMap — reusable choropleth map primitive. Typed React + D3 v7 port of
 * `components/svg-map/{index,color,mouse}.coffee` (the legacy `base.coffee`
 * page-orchestration stays in P2.2 per the agreed strangler-fig seam).
 *
 * PUBLIC API (data in, events out — no page-specific wiring, no URL/Backbone):
 *   - `topology` + `objectKey`: TopoJSON to render (via `topojson-client`).
 *   - `colorData` + `colorMin`/`colorMax`: choropleth values; drives the
 *     quantile coloring and the color key.
 *   - `selectedId` / `hoveredId`: CONTROLLED selection — the page owns this
 *     state (and the URL `?area=&hover=` contract via `@/lib/url-state`).
 *   - `onSelect(id | null)` / `onHover(id | null)`: events out (replace the
 *     legacy `Backbone.history.navigate("?area=…")` calls).
 *   - `children(projection)`: optional render-prop receiving the live
 *     `GeoProjection`. The consumer projects its own `[lng, lat]` points (e.g.
 *     NC census-tract circles) and returns SVG to overlay ON TOP of the
 *     choropleth, inside the same zoom group — so overlays share the map's
 *     projection AND its click-zoom transform. SvgMap never styles these marks.
 *
 * D3 owns the math (`geoMercator` + `geoPath`, fit-to-bounds, `scaleQuantile`);
 * React owns every `<path>`/`<text>`. Click-zoom is a CSS transform on the
 * group (no `d3.select` transition).
 */
import { geoMercator, geoPath } from 'd3';
import type { GeoProjection } from 'd3';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { feature } from 'topojson-client';

import { ColorKey } from '@/components/ColorKey';
import { classifyColors, formatKeyValues } from '@/lib/map-color';
import type { ColorDatum } from '@/types';

/** TopoJSON topology, derived from `topojson-client`'s `feature` signature. */
type Topology = Parameters<typeof feature>[0];

export interface SvgMapProps {
  topology: Topology;
  /** Key into `topology.objects` (legacy default `'neighborhoods'`). */
  objectKey?: string;
  width: number;
  height: number;
  /** Mercator rotation `[λ, φ]` (legacy NYC default). */
  rotate?: [number, number];
  /** Fit scale factor (legacy default 0.95). */
  scale?: number;
  translateX?: number;
  translateY?: number;
  /** Feature-id substrings to render as inert "park" hatch and exclude from clicks. */
  ignoredIds?: string[];
  /** Choropleth values `{ id, value }`. */
  colorData?: ColorDatum[];
  colorMin?: number;
  colorMax?: number;
  /** Controlled selection / hover (the page owns this state). */
  selectedId?: string | null;
  hoveredId?: string | null;
  /** Events out — page maps these to URL state. */
  onSelect?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  /** Map title (top-left). */
  title?: string;
  /** Hover-text formatter (top-left, below the title). */
  formatHoverText?: (id: string) => string;
  /** Reverse the color key order (legacy default true). */
  reverseColorKey?: boolean;
  /** Color-key total width (defaults to map width). */
  colorKeyWidth?: number;
  /** Animate a zoom-to-feature on selection (legacy default true). */
  zoomOnClick?: boolean;
  /**
   * Color palette class applied to the wrapper div.
   * 'reds' (default) = Reds scale (crime/311); 'spectral' = blue-green Spectral (price data).
   */
  colorPalette?: 'reds' | 'spectral';
  /**
   * Optional overlay render-prop. Receives the live `GeoProjection` (already
   * fit to the viewport) so the consumer can project `[lng, lat]` → `[x, y]`
   * and return SVG (e.g. `<circle>` tract markers) drawn on top of the
   * choropleth, within the same zoom group. Omit for a plain choropleth.
   */
  children?: (projection: GeoProjection) => ReactNode;
}

const DEFAULT_ROTATE: [number, number] = [74 + 700 / 60, -38 - 50 / 60];

export function SvgMap({
  topology,
  objectKey = 'neighborhoods',
  width,
  height,
  rotate = DEFAULT_ROTATE,
  scale = 0.95,
  translateX = 0,
  translateY = 0,
  ignoredIds = [],
  colorData,
  colorMin = 0,
  colorMax = 1000,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  title,
  formatHoverText,
  reverseColorKey = true,
  colorKeyWidth,
  zoomOnClick = true,
  colorPalette = 'reds',
  children,
}: SvgMapProps) {
  const isIgnored = (id: string) => ignoredIds.some((ignored) => id.includes(ignored));

  // Build the projection + path generator and fit the features to the viewport.
  const { features, path, projection } = useMemo(() => {
    const objects = (topology as { objects: Record<string, unknown> }).objects;
    const fc = feature(
      topology,
      objects[objectKey] as Parameters<typeof feature>[1],
    ) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;

    const projection = geoMercator().rotate(rotate).scale(1).translate([0, 0]);
    const pathGen = geoPath(projection);
    const bounds = pathGen.bounds(fc);
    const fitScale =
      scale /
      Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
    const translate: [number, number] = [
      (width - fitScale * (bounds[1][0] + bounds[0][0])) / 2 + translateX,
      (height - fitScale * (bounds[1][1] + bounds[0][1])) / 2 + translateY,
    ];
    projection.scale(fitScale).translate(translate);
    return { features: fc.features, path: pathGen, projection };
  }, [topology, objectKey, width, height, rotate, scale, translateX, translateY]);

  // Per-id color class from the quantile scale (mirrors `colorMap`).
  const colorInfo = useMemo(
    () => (colorData ? classifyColors(colorData, colorMin, colorMax) : null),
    [colorData, colorMin, colorMax],
  );

  // Zoom-to-feature transform (CSS-transitioned), or identity.
  const zoomTransform = useMemo(() => {
    if (!zoomOnClick || !selectedId) return undefined;
    const selected = features.find((f) => String(f.id) === selectedId);
    if (!selected) return undefined;
    const b = path.bounds(selected);
    const dx = b[1][0] - b[0][0];
    const dy = b[1][1] - b[0][1];
    const cx = (b[0][0] + b[1][0]) / 2;
    const cy = (b[0][1] + b[1][1]) / 2;
    const z = 0.9 / Math.max(dx / width, dy / height);
    return `translate(${width / 2 - z * cx},${height / 2 - z * cy}) scale(${z})`;
  }, [zoomOnClick, selectedId, features, path, width, height]);

  const shapeClass = (id: string) => {
    if (isIgnored(id)) return 'park';
    const parts = ['tract'];
    if (id === selectedId) parts.push('selected');
    else if (selectedId != null) parts.push('dimmed');
    const colorClass = colorInfo?.classes.get(id);
    if (colorClass) parts.push(colorClass);
    return parts.join(' ');
  };

  // Color-key bars/values (reversed by default, matching the legacy key).
  let keyClasses = colorInfo?.range ?? [];
  let keyValues = formatKeyValues(colorInfo?.quantiles ?? []);
  if (reverseColorKey) {
    keyClasses = [...keyClasses].reverse();
    keyValues = [...keyValues].reverse();
  }

  const wrapperClass = colorPalette === 'spectral' ? 'spectral-map' : undefined;

  return (
    <div className={wrapperClass}>
      <svg width={width} height={height}>
        {/* Hatch fill for inert "park" areas — referenced by `.tract.park`
            (`fill: url(#hatch)` in globals.css). Without this defs the paint
            reference fails and parks render as solid black. */}
        <defs>
          <pattern
            id="hatch"
            patternUnits="userSpaceOnUse"
            width={6}
            height={6}
            patternTransform="rotate(45)"
          >
            <rect width={6} height={6} fill="var(--muted, #e8eaed)" />
            <line x1={0} y1={0} x2={0} y2={6} stroke="#c2c9d1" strokeWidth={1.5} />
          </pattern>
        </defs>
        <g
          transform={zoomTransform}
          style={{ transition: 'transform 0.5s', strokeWidth: zoomTransform ? 0.5 : 1 }}
        >
          {features.map((f) => {
            const id = String(f.id);
            const ignored = isIgnored(id);
            return (
              <path
                key={id}
                className={shapeClass(id)}
                data-id={id}
                d={path(f) ?? undefined}
                onClick={ignored ? undefined : () => onSelect?.(id === selectedId ? null : id)}
                onMouseEnter={ignored ? undefined : () => onHover?.(id)}
              />
            );
          })}
          {/* Consumer overlay (e.g. projected tract circles), aligned to the
              same projection and zoomed with the choropleth. */}
          {children?.(projection)}
        </g>
        {title && (
          <text className="label-text" x={10} y={20}>
            {title}
          </text>
        )}
        {formatHoverText && hoveredId && (
          <text className="hover-text" x={10} y={40}>
            {formatHoverText(hoveredId)}
          </text>
        )}
      </svg>
      {colorInfo && (
        <ColorKey
          classes={keyClasses}
          values={keyValues}
          label={title ?? ''}
          width={Math.floor((colorKeyWidth ?? width) / Math.max(keyClasses.length, 1))}
        />
      )}
    </div>
  );
}
