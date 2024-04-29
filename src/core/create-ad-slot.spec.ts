import { createAdSize } from './ad-sizes';
import { concatSizeMappings, createAdSlot } from './create-ad-slot';

const imHtml = `
<div id="dfp-ad--im"
    class="js-ad-slot ad-slot ad-slot--im"
    data-link-name="ad slot im"
    data-name="im"
    aria-hidden="true"
    data-label="false"
    data-refresh="false"></div>
`;

const inline1Html = `
<div id="dfp-ad--inline1"
    class="js-ad-slot ad-slot ad-slot--inline ad-slot--inline1"
    data-link-name="ad slot inline1"
    data-name="inline1"
    aria-hidden="true">
</div>
`;

describe('Create Ad Slot', () => {
	it('should exist', () => {
		expect(createAdSlot).toBeDefined();
	});

	it.each([
		{
			type: 'im' as const,
			htmls: imHtml,
			name: undefined,
			classes: undefined,
		},
		{
			type: 'inline' as const,
			classes: 'inline',
			name: 'inline1',
			htmls: inline1Html,
		},
	])(`should create $type ad slot`, ({ type, name, classes, htmls }) => {
		const adSlot = createAdSlot(type, {
			name,
			classes,
		});

		expect(adSlot.outerHTML).toBe(
			htmls.replace(/\n/g, '').replace(/\s+/g, ' '),
		);
	});
});

describe('concatSizeMappings', () => {
	it('should exist', () => {
		expect(concatSizeMappings).toBeDefined();
	});

	it('should return the same size mapping if only one provided', () => {
		const sizeMapping = {
			mobile: [createAdSize(300, 250)],
			tablet: [createAdSize(728, 90)],
			desktop: [createAdSize(970, 250)],
			wide: [createAdSize(970, 250)],
		};

		expect(concatSizeMappings(sizeMapping)).toEqual(sizeMapping);
	});

	it('should return the combined size mapping if multiple provided', () => {
		const sizeMapping1 = {
			mobile: [createAdSize(300, 250)],
		};
		const sizeMapping2 = {
			tablet: [createAdSize(728, 90)],
		};

		expect(concatSizeMappings(sizeMapping1, sizeMapping2)).toEqual({
			mobile: [createAdSize(300, 250)],
			tablet: [createAdSize(728, 90)],
		});
	});

	it('should return the combined size mapping if multiple provided with overlapping breakpoints', () => {
		const sizeMapping1 = {
			mobile: [createAdSize(300, 250)],
			tablet: [createAdSize(728, 90)],
		};
		const sizeMapping2 = {
			mobile: [createAdSize(300, 250), createAdSize(320, 50)],
		};

		expect(concatSizeMappings(sizeMapping1, sizeMapping2)).toEqual({
			mobile: [createAdSize(300, 250), createAdSize(320, 50)],
			tablet: [createAdSize(728, 90)],
		});
	});

	it('should return the combined size mapping if the first size mapping is empty', () => {
		const sizeMapping1 = {};
		const sizeMapping2 = {
			wide: [createAdSize(728, 90)],
		};

		expect(concatSizeMappings(sizeMapping1, sizeMapping2)).toEqual({
			wide: [createAdSize(728, 90)],
		});
	});
});
