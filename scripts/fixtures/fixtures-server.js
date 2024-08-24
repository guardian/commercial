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

const isStringTuple = (_) => typeof _[1] === 'string';

/**
 * @param {string} path
 * @returns {Promise<Record<string, unknown>>}
 */
const fetchDcrDataModel = async (path, _headers) => {
	const url = getProdDataUrl(path);
	try {
		// Forward cookies and x-gu headers
		const headers = Object.fromEntries(
			Object.entries(_headers)
				.filter(
					([key]) =>
						key.toLowerCase() === 'cookie' ||
						key.toLowerCase().startsWith('x-gu-'),
				)
				.filter(isStringTuple),
		);

		const res = await fetch(url, { headers });
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
 * Add additional endpoints that proxy Frontend, merging into the resulting JSON
 * any overrides provided as a fixture.
 *
 * These can then be used by an E2E test in order to fix certain behavior about
 * the system-under-test e.g. override a switch state to always be true.
 *
 * @param {import('webpack-dev-server')} devServer
 */
const setupFixturesServer = (devServer) => {
	if (!devServer) {
		throw new Error('webpack-dev-server is not defined');
	}

	devServer.app.get(
		'/renderFixture/*.json',
		/**
		 * Pass a base-64 encoded JSON fixture as a query parameter. This is
		 * merged into the DCR data retrieved from frontend for the given path
		 *
		 *  `http://localhost:PORT/renderFixture/uk.json?fixture=...`
		 */
		async function (req, res) {
			const path = req.params[0];
			const fixtureQuery = req.query['fixture'];
			const fixture = JSON.parse(
				Buffer.from(fixtureQuery, 'base64').toString(),
			);

			// Fetch the JSON for the given path from PROD Frontend
			const dataModel = await fetchDcrDataModel(path, req.headers);

			if (!dataModel) {
				console.error(
					'Something went wrong retrieving DCR data from PROD',
				);
				return res.status(503).send();
			}
			// Merge the fixture into the data model
			// Note that this will be a deep merge
			merge(dataModel, fixture);

			return res.json(dataModel);
		},
	);

	devServer.app.get(
		'/renderFixtureWithId/:fixtureId/*.json',
		/**
		 * Take a fixture stored with the fixtures server and apply it by
		 * passing in its ID
		 *
		 * These fixtures are stored in fixtures.js in an object keyed by the
		 * fixture ID, and are merged into the JSON returned for the rest of the
		 * path. For example, to override the data for the /uk path with fixture
		 * id 'foo' you could call:
		 *
		 *  `http://localhost:PORT/renderFixtureWithId/fixtureFoo/uk.json`
		 */
		async function (req, res) {
			const path = req.params[0];
			const fixtureId = req.params.fixtureId;
			const fixture = fixtures[fixtureId];

			if (!fixture) {
				console.error(`Fixture with id ${fixtureId} not found`);
				return res.status(404).send();
			}

			// Fetch the JSON for the given path from PROD Frontend
			const dataModel = await fetchDcrDataModel(path, req.headers);

			if (!dataModel) {
				console.error(
					'Something went wrong retrieving DCR data from PROD',
				);
				return res.status(503).send();
			}

			// Merge the fixture into the data model
			// Note that this will be a deep merge
			merge(dataModel, fixture);

			return res.json(dataModel);
		},
	);
};

module.exports = {
	setupFixturesServer,
};
