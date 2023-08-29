const { fixtures } = require('./fixtures');
const { merge } = require('lodash');

/**
 * For a given relative path in production,
 * retrieve the JSON required to render on DCR
 *
 * @param {string} path
 * @returns {string}
 */
const getProdDataUrl = (path) =>
	`https://theguardian.com/${path}.json?dcr=true`;

/**
 * @param {string} path
 * @returns {Promise<Record<string, unknown>>}
 */
const fetchDcrDataModel = async (path) => {
	const url = getProdDataUrl(path);
	try {
		const res = await fetch(url);
		if (!res.ok) {
			return undefined;
		}
		const json = await res.json();
		return json;
	} catch (err) {
		console.error(err);
		return undefined;
	}
};

/**
 * @param {import('webpack-dev-server')} devServer
 */
const setupFixturesServer = (devServer) => {
	if (!devServer) {
		throw new Error('webpack-dev-server is not defined');
	}
	devServer.app.get('/renderFixture/:fixtureId/*.json', async (req, res) => {
		const path = req.params[0];
		const fixtureId = req.params.fixtureId;
		const fixture = fixtures[fixtureId];

		if (!fixture) {
			console.error(`Fixture with id ${fixtureId} not found`);
			return res.status(404).send();
		}

		// Fetch the JSON for the given path from PROD Frontend
		const dataModel = await fetchDcrDataModel(path);

		if (!dataModel) {
			console.error('Something went wrong retrieving DCR data from PROD');
			return res.status(503).send();
		}

		// Merge the fixture into the data model
		// Note that this will be a deep merge
		merge(dataModel, fixture);

		return res.json(dataModel);
	});
};

module.exports = {
	setupFixturesServer,
};
