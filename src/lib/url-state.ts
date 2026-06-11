/**
 * URL deep-link contract for the visualization pages.
 *
 * This is the typed replacement for the legacy Backbone router
 * (`components/graph-key/router.coffee`) plus the `?type=` / `?date=` / `?area=`
 * `Backbone.history.navigate` calls scattered across `select/`, `slider/`, and
 * `svg-map/mouse.coffee`. It is the canonical contract P2.2 page assemblies
 * consume — the URLs and deep-link states it parses/serializes MUST keep
 * resolving (see MIGRATION.md §3).
 *
 * Legacy precedence (router.coffee `handleRoute`): area → type → date → overview.
 */

/** A decoded deep-link state. Discriminated on `kind`. */
export type GraphState =
  | { kind: 'overview' }
  | { kind: 'area'; area: string; hover?: string }
  | { kind: 'type'; type: string }
  | { kind: 'date'; date: number };

/**
 * Decode a query string (with or without leading `?`) or a `URLSearchParams`
 * into a `GraphState`, honoring the legacy precedence: area → type → date →
 * overview. Unknown params are ignored.
 */
export function parseGraphState(input: string | URLSearchParams): GraphState {
  const params =
    typeof input === 'string'
      ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
      : input;

  const area = params.get('area');
  if (area) {
    const hover = params.get('hover');
    return hover ? { kind: 'area', area, hover } : { kind: 'area', area };
  }

  const type = params.get('type');
  if (type) {
    return { kind: 'type', type };
  }

  const date = params.get('date');
  if (date !== null && date !== '') {
    const value = Number(date);
    if (!Number.isNaN(value)) {
      return { kind: 'date', date: value };
    }
  }

  return { kind: 'overview' };
}

/**
 * Serialize a `GraphState` back to a query string (no leading `?`; empty string
 * for overview). Round-trips with `parseGraphState`.
 */
export function serializeGraphState(state: GraphState): string {
  const params = new URLSearchParams();
  switch (state.kind) {
    case 'area':
      params.set('area', state.area);
      if (state.hover) params.set('hover', state.hover);
      break;
    case 'type':
      params.set('type', state.type);
      break;
    case 'date':
      params.set('date', String(state.date));
      break;
    case 'overview':
      break;
  }
  return params.toString();
}
