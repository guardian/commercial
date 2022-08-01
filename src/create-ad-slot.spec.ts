import { createAdSlot } from './create-ad-slot';

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
	beforeEach(() => {
		window.guardian = {
			config: {
				isDotcomRendering: true,
			},
		};
	});
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
