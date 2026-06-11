/**
 * Linear (choropleth) color key — typed React port of
 * `components/graph-key/linear-key.jade`.
 *
 * Renders a row of equal-width color bars (one per quantile class) above the
 * formatted breakpoint values, with a label. Class names match the legacy
 * Stylus (`linear-graph-key`, `key-bars`, `key-bar`, `key-bar-values`,
 * `key-bar-value`, `key-label`) for visual parity.
 */

export interface ColorKeyProps {
	/** CSS classes, one per bar, in display order (e.g. `["color0", "color1", …]`). */
	classes: string[];
	/** Formatted breakpoint values shown beneath the bars. */
	values: string[];
	/** Label text below the key. */
	label: string;
	/** Per-bar width in px. */
	width: number;
	/** Left margin in px (legacy `margin.left`). */
	marginLeft?: number;
}

export function ColorKey({ classes, values, label, width, marginLeft = 0 }: ColorKeyProps) {
	return (
		<div className="linear-graph-key" style={{ marginLeft }}>
			<div className="key-bars">
				{classes.map((cls, i) => (
					<div className={`key-bar ${cls}`} style={{ width }} key={`${cls}-${i}`} />
				))}
			</div>
			<div className="key-bar-values">
				{values.map((value, i) => (
					<div className="key-bar-value" style={{ width }} key={`${value}-${i}`}>
						{value}
					</div>
				))}
			</div>
			<div className="key-label">{label}</div>
		</div>
	);
}
