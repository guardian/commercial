const logGumGumWinningBid = (slotID: string, advertiserId: string): void => {
	const endpoint = window.guardian.config.page.isDev
		? '//logs.code.dev-guardianapis.com/log'
		: '//logs.guardianapis.com/log';

	if (!slotID || !advertiserId) {
		return;
	}

	void fetch(endpoint, {
		method: 'POST',
		body: JSON.stringify({
			label: 'commercial.gumgum.winningBid',
			properties: [
				{ name: 'slotID', value: slotID },
				{ name: 'advertiserId', value: advertiserId },
				{ name: 'gumgumId', value: '1lsxjb4' },
				{
					name: 'pageviewId',
					value: window.guardian.config.ophan.pageViewId,
				},
			],
		}),
		keepalive: true,
		cache: 'no-store',
		mode: 'no-cors',
	});
};

export { logGumGumWinningBid };
