window.guardian = {
	config: {
		switches: {},
		page: {},
		images: {
			commercial: {},
		},
		libs: {},
	},
	css: {},
	adBlockers: {
		active: undefined,
		onDetect: [],
	},
};

window.matchMedia =
	window.matchMedia ||
	function () {
		return {
			matches: false,
			addListener() {},
			removeListener() {},
		};
	};
