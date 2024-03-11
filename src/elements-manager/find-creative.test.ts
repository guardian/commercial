import { _ } from './find-creative';
import { type LineItem } from './line-items';

const { pickLineItem } = _;

describe('pickLineItem', () => {
	it('should return expected distribution', () => {
		const lineItems = [
			{ priority: 1 },
			{ priority: 2 },
			{ priority: 3 },
			{ priority: 4 },
			{ priority: 5 },
			{ priority: 6 },
			{ priority: 7 },
			{ priority: 8 },
			{ priority: 9 },
			{ priority: 10 },
			{ priority: 11 },
			{ priority: 12 },
		] as LineItem[];

		const iterations = 10000;

		const priorityCounts: Record<number, number> = {};

		for (let i = 0; i < iterations; i++) {
			const lineItem = pickLineItem(lineItems);

			if (!lineItem) {
				throw new Error('No line item found');
			}
			if (lineItem.priority in priorityCounts) {
				priorityCounts[lineItem.priority]++;
			} else {
				priorityCounts[lineItem.priority] = 1;
			}
		}

		//check order of priorities sorted by counts is as expected aka descending
		const sortedPriorities = Object.entries(priorityCounts).sort(
			(a, b) => b[1] - a[1],
		);

		const sortedPrioritiesValues = sortedPriorities.map((x) => x[0]);

		expect(sortedPrioritiesValues).toEqual(
			Object.keys(priorityCounts).sort((a, b) => +a - +b),
		);
	});
});
