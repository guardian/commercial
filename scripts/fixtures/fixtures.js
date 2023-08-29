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

const fixtures = {
	overwriteShouldLoadGoogletagTrue,
	overwriteShouldLoadGoogletagFalse,
};

module.exports = {
	fixtures,
};
