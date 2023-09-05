const overwriteShouldLoadGoogletagTrue = {
	config: {
		switches: {
			shouldLoadGoogletag: true,
		},
	},
};

const overwriteShouldLoadGoogletagFalse = {
	config: {
		switches: {
			shouldLoadGoogletag: false,
		},
	},
};

/**
 * The fixtures represent a set of objects that is deeply merged into the JSON
 * data that is used by DCR. It can be used to override properties for the
 * purposes of testing e.g. to set a switch state to be true regardless of
 * the state in PROD.
 *
 * Each of the fixtures is available via an endpoint (see fixtures-server.js)
 */
const fixtures = {
	overwriteShouldLoadGoogletagTrue,
	overwriteShouldLoadGoogletagFalse,
};

module.exports = {
	fixtures,
};
