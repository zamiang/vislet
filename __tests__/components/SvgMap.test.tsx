import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SvgMap } from '@/components/SvgMap';

// Minimal absolute-coordinate topology: two square tracts, A and B.
const topology = {
  type: 'Topology',
  arcs: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 0],
      [1, 0],
    ],
  ],
  objects: {
    neighborhoods: {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Polygon', id: 'A', arcs: [[0]] },
        { type: 'Polygon', id: 'B', arcs: [[1]] },
      ],
    },
  },
} as unknown as Parameters<typeof SvgMap>[0]['topology'];

const base = { topology, width: 200, height: 200 } as const;

describe('<SvgMap />', () => {
  it('renders a path per feature with data-id', () => {
    const { container } = render(<SvgMap {...base} />);
    expect(container.querySelectorAll('path[data-id]').length).toBe(2);
    expect(container.querySelector('path[data-id="A"]')?.getAttribute('d')).toMatch(/^M/);
  });

  it('emits onSelect with the clicked id, and null when re-clicking the selection', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(<SvgMap {...base} onSelect={onSelect} />);
    fireEvent.click(container.querySelector('path[data-id="A"]')!);
    expect(onSelect).toHaveBeenCalledWith('A');

    rerender(<SvgMap {...base} onSelect={onSelect} selectedId="A" />);
    fireEvent.click(container.querySelector('path[data-id="A"]')!);
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('marks the selected feature and renders a color key from colorData', () => {
    const { container } = render(
      <SvgMap
        {...base}
        selectedId="A"
        colorData={[
          { id: 'A', value: 10 },
          { id: 'B', value: 90 },
        ]}
        colorMin={0}
        colorMax={100}
        title="Crimes"
      />,
    );
    expect(container.querySelector('path[data-id="A"]')?.getAttribute('class')).toContain(
      'selected',
    );
    expect(container.querySelector('.linear-graph-key')).not.toBeNull();
    expect(container.querySelectorAll('.key-bar').length).toBe(9);
  });

  it('renders a children overlay, passing a usable projection that maps lng/lat → px', () => {
    let projectedAt: [number, number] | null = null;
    const { container } = render(
      <SvgMap {...base}>
        {(projection) => {
          const xy = projection([0.5, 0.5]);
          projectedAt = xy as [number, number];
          return xy ? <circle data-id="tract-1" cx={xy[0]} cy={xy[1]} r={3} /> : null;
        }}
      </SvgMap>,
    );
    // The render-prop received a working projection (finite px coordinates).
    expect(projectedAt).not.toBeNull();
    expect(Number.isFinite(projectedAt![0])).toBe(true);
    expect(Number.isFinite(projectedAt![1])).toBe(true);
    // The overlay mark is drawn inside the same zoom <g> as the choropleth paths.
    const circle = container.querySelector('circle[data-id="tract-1"]');
    expect(circle).not.toBeNull();
    expect(circle!.closest('g')!.querySelector('path[data-id]')).not.toBeNull();
  });

  it('renders no overlay group content when children is omitted (backward-compatible)', () => {
    const { container } = render(<SvgMap {...base} />);
    expect(container.querySelector('circle')).toBeNull();
  });
});
