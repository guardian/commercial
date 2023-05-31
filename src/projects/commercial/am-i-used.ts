type Property = {
	name: string;
	value: string;
};

type RestrictedKeys = 'module_name' | 'function_name' | 'URL';

type RestrictedProperty = Property & {
	name: RestrictedKeys;
};

type AmIUsedLoggingEvent = {
	label: string;
	properties?: Property[];
};

/**
 * This function is used to send a logging event to BigQuery, which is
 * logged into the `fastly_logging` table within the `logging` dataset.
 * @param moduleName the name of the JS/TS module (e.g. `article-body-adverts`)
 * @param functionName the name of the function within the module (e.g. `init`)
 * @param parameters an optional object to add function-specific information (e.g. `{ conditionA: 'true', conditionB: 'false' }`)
 * @returns void.
 */
const amIUsed = (
	moduleName: string,
	functionName: string,
	parameters?: Partial<
		Record<string, string> & Record<RestrictedKeys, never>
	>,
): void => {
	// The function will return early if the sentinelLogger switch is disabled.
	if (!window.guardian.config.switches.sentinelLogger) return;

	const endpoint = window.guardian.config.page.isDev
		? '//logs.code.dev-guardianapis.com/log'
		: '//logs.guardianapis.com/log';

	const properties: RestrictedProperty[] = [
		{ name: 'module_name', value: moduleName },
		{ name: 'function_name', value: functionName },
		{ name: 'URL', value: window.location.href },
	];

	const event: AmIUsedLoggingEvent = {
		label: 'commercial.amiused',
		properties: parameters
			? [
					...properties,
					...Object.entries(parameters).map(([name, value]) => ({
						name,
						value: String(value),
					})),
			  ]
			: properties,
	};

	const sampling = 5 / 100;
	const shouldTestBeacon = Math.random() <= sampling;

	if (shouldTestBeacon) {
		const beaconEvent = {
			...event,
			label: 'commercial.amiused.beacontest',
		};
		window.navigator.sendBeacon(endpoint, JSON.stringify(beaconEvent));

		const fetchEvent = { ...event, label: 'commercial.amiused.fetchtest' };
		window.onunload = function () {
			void fetch(endpoint, {
				method: 'POST',
				body: JSON.stringify(fetchEvent),
				keepalive: true,
			});
		};
	} else {
		window.navigator.sendBeacon(endpoint, JSON.stringify(event));
	}
};

export { amIUsed, type AmIUsedLoggingEvent };
