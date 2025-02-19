interface TPCTestPayload {
	tpcTest: boolean;
	hasStorageAccess?: boolean;
}

const isTPCTestPayload = (payload: unknown): payload is TPCTestPayload =>
	typeof payload === 'object' &&
	payload !== null &&
	'tpcTest' in payload &&
	typeof payload.tpcTest === 'boolean';

/**
 * Check if third party cookies are enabled
 * This is done by creating an iframe on another domain and checking if it can access cookies
 **/
const checkThirdPartyCookiesEnabled = (): void => {
	const crossSiteIrame = document.createElement('iframe');

	crossSiteIrame.style.display = 'none';
	crossSiteIrame.src = `${window.guardian.config.frontendAssetsFullURL}commercial/tpc-test/v1/index.html`;

	window.addEventListener('message', ({ data }) => {
		if (isTPCTestPayload(data)) {
			const { hasStorageAccess } = data;

			// only set targeting if the value is defined
			if (hasStorageAccess !== undefined) {
				window.googletag
					.pubads()
					.setTargeting('3pc', [hasStorageAccess ? 't' : 'f']);
			}
		}
	});

	document.body.appendChild(crossSiteIrame);
};

export { checkThirdPartyCookiesEnabled };
