// Polyfill test environment (done by polyfill.io in production)
require('core-js');

// Stub global Guardian config
// eslint-disable-next-line id-denylist -- this is on purpose
window.guardian = {
	config: {
		switches: {},
		page: {
			idApiUrl: 'https://idapi.theguardian.com',
			idUrl: 'https://profile.theguardian.com',
			pageId: 'uk-politics',
		},
		images: {
			commercial: {},
		},
		libs: {},
		ophan: {
			browserId: 'dummy_bwid_24680',
		},
	},
	ophan: {
		pageViewId: 'dummy_pvid_123456790',
		record: jest.fn(),
	},
	css: {},
	adBlockers: {
		active: undefined,
		onDetect: [],
	},
	modules: {
		sentry: {
			reportError: jest.fn(),
		},
	},
};

window.fetch = jest.fn().mockImplementation(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve({}),
	}),
);

// Stub matchmedia
window.matchMedia =
	window.matchMedia ||
	jest.fn().mockImplementation(() => ({
		matches: false,
		addListener: jest.fn(),
		addEventListener: jest.fn(),
	}));
