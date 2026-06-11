import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LineGraph } from '@/components/LineGraph';
import type { LineGraphData } from '@/lib/line-chart';

const JAN_2013 = Date.UTC(2013, 0, 1);
const JAN_2014 = Date.UTC(2014, 0, 1);

const data: LineGraphData = {
	'park-slope': {
		price: [
			{ date: JAN_2013, value: 100 },
			{ date: JAN_2014, value: 200 },
		],
	},
};

describe('<LineGraph />', () => {
	it('renders an svg with a line path and axes', () => {
		const { container } = render(
			<LineGraph
				data={data}
				keys={['price']}
				startingDataset="park-slope"
				width={400}
				height={200}
				label="Median price"
			/>,
		);
		const svg = container.querySelector('svg');
		expect(svg).not.toBeNull();
		expect(svg?.getAttribute('width')).toBe('450'); // 400 + margin.left(50) + right(0)
		expect(container.querySelector('path.line')?.getAttribute('d')).toMatch(/^M/);
		expect(container.querySelectorAll('.axis').length).toBe(2);
		expect(container.querySelector('.label-text')?.textContent).toBe('Median price');
	});

	it('renders a legend when keyLabel is provided', () => {
		const { container } = render(
			<LineGraph
				data={data}
				keys={['price']}
				startingDataset="park-slope"
				width={400}
				height={200}
				keyLabel={(id) => id.toUpperCase()}
			/>,
		);
		expect(container.querySelector('.graph-keys')).not.toBeNull();
		expect(container.querySelector('.key-text')?.textContent).toBe('PARK-SLOPE');
	});
});
