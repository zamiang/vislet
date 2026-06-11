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
});
