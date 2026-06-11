/**
 * Dropdown control — typed React port of `components/select/index.coffee`.
 *
 * The legacy view built `<option>`s from a `{ value: label }` map, optionally
 * prepending an `ALL` option, and pushed the selection into the URL via
 * `Backbone.history.navigate("?type=…")`. Here we keep it a controlled
 * component and surface the selection through `onChange`; the URL wiring lives
 * with the page (P2.2) via `serializeGraphState({ kind: 'type', … })`.
 */

export interface SelectProps {
  /** Map of option value → display label. */
  options: Record<string, string>;
  /** Currently selected value (`"ALL"` when `includeAll` and nothing chosen). */
  value: string;
  /** Called with the newly selected value. */
  onChange: (value: string) => void;
  /** Prepend an `ALL` option (legacy default: true). */
  includeAll?: boolean;
  id?: string;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  includeAll = true,
  id,
  className,
}: SelectProps) {
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {includeAll && <option value="ALL">ALL</option>}
      {Object.keys(options).map((key) => (
        <option value={key} key={key}>
          {options[key]}
        </option>
      ))}
    </select>
  );
}
