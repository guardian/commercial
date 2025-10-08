import type { imrWorldwide } from './imr-worldwide';

// imrWorldwide is not automatically loaded as there are params and modules that are run/defined on load
const getImrWorldwide = (
	isSwitchedOn?: boolean,
	isEnabledInAuOrNz?: boolean,
) => {
	jest.resetModules();
	jest.mock('@guardian/commercial-core/geo/geo-utils', () => ({
		isInAuOrNz: jest.fn(() => isEnabledInAuOrNz),
	}));

	window.guardian.config.switches.imrWorldwide = isSwitchedOn;

	// eslint-disable-next-line @typescript-eslint/no-require-imports -- require dynamically
	const required = require('./imr-worldwide') as {
		imrWorldwide: typeof imrWorldwide;
	};
	return required.imrWorldwide;
};

describe('imrWorldwide', () => {
	describe('onLoad', () => {
		// setup sdk mocks
		const ggInitializeMock = jest.fn();
		const ggPMMock = jest.fn();
		const getInstanceMock = jest.fn(() => ({
			ggInitialize: ggInitializeMock,
			ggPM: ggPMMock,
		}));

		const originalPageSection = window.guardian.config.page.section;
		beforeEach(() => {
			window.NOLCMB = {
				getInstance: getInstanceMock,
			};
		});

		afterEach(() => {
			window.guardian.config.page.section = originalPageSection;
			jest.clearAllMocks();
		});

		it('calls Nielsen SDK for known section', () => {
			// setup
			window.guardian.config.page.pageId = 'anyPageId';
			window.guardian.config.page.section = 'business';

			// run
			getImrWorldwide().onLoad();

			// assert
			const businessApId = 'P5B109609-6223-45BA-B052-55F34A79D7AD';
			expect(getInstanceMock).toHaveBeenCalledWith(businessApId);
			expect(ggInitializeMock).toHaveBeenCalledWith({
				apid: businessApId,
				apn: 'theguardian',
				sfcode: 'dcr',
			});
			expect(ggPMMock).toHaveBeenCalledWith('staticstart', {
				assetid: 'anyPageId',
				section: 'business',
				type: 'static',
			});
		});

		it('calls Nielsen SDK with "brand" section for unknown section', () => {
			// setup
			window.guardian.config.page.pageId = 'anyPageId';
			window.guardian.config.page.section = 'unknownSection';

			// run
			getImrWorldwide().onLoad();

			// assert
			const brandApId = 'P0EE0F4F4-8D7C-4082-A2A4-82C84728DC59';
			expect(getInstanceMock).toHaveBeenCalledWith(brandApId);
			expect(ggInitializeMock).toHaveBeenCalledWith({
				apid: brandApId,
				apn: 'theguardian',
				sfcode: 'dcr',
			});
			expect(ggPMMock).toHaveBeenCalledWith('staticstart', {
				assetid: 'anyPageId',
				section: 'The Guardian - brand only',
				type: 'static',
			});
		});
	});

	describe('shouldRun', () => {
		it('is FALSE if switched off', () => {
			const { shouldRun } = getImrWorldwide(false);
			expect(shouldRun).toEqual(false);
		});

		it('is FALSE if switched on but geolocation is not AU/NZ', () => {
			const { shouldRun } = getImrWorldwide(true, false);
			expect(shouldRun).toEqual(false);
		});

		it('is TRUE if switched on and geolocation is AU/NZ', () => {
			const { shouldRun } = getImrWorldwide(true, true);
			expect(shouldRun).toEqual(true);
		});
	});
});
