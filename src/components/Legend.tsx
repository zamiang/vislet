/**
 * Categorical legend — typed React port of `components/graph-key/key.jade`.
 *
 * Each entry renders a colored swatch (either an inline `color` or a CSS
 * `colorClass`) next to its label. Class names match the legacy Stylus
 * (`graph-keys`, `graph-key`, `key-circle`, `key-text`) for visual parity until
 * styles are migrated.
 */

export interface LegendEntry {
  /** Inline swatch color (e.g. `"steelblue"`). Mutually exclusive with `colorClass`. */
  color?: string;
  /** CSS class for the swatch (e.g. `"color3"`). Mutually exclusive with `color`. */
  colorClass?: string;
  /** Label text. */
  text: string;
}

export interface LegendProps {
  entries: LegendEntry[];
  /** Left margin in px, matching the chart's left margin (legacy `margin.left`). */
  marginLeft?: number;
}

export function Legend({ entries, marginLeft = 0 }: LegendProps) {
  return (
    <div className="graph-keys" style={{ marginLeft }}>
      {entries.map((entry, i) => (
        <div className="graph-key" key={`${entry.text}-${i}`}>
          {entry.color != null && (
            <div className="key-circle" style={{ backgroundColor: entry.color }} />
          )}
          {entry.colorClass != null && <div className={`key-circle ${entry.colorClass}`} />}
          <div className="key-text">{entry.text}</div>
        </div>
      ))}
    </div>
  );
}
