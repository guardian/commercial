import { buildImaAdTagUrl } from './youtube-ima';

describe('Builds an IMA ad tag URL', () => {
	it('default values and empty custom parameters', () => {
		const adTagURL = buildImaAdTagUrl('someAdUnit', {}, {});
		expect(adTagURL).toEqual(
			'https://pubads.g.doubleclick.net/gampad/ads?iu=someAdUnit&description_url=[placeholder]&tfcd=0&npa=0&sz=480x360|480x361|400x300&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=&vad_type=linear&vpos=preroll&cust_params=',
		);
	});
	it('default values and encoded custom parameters', () => {
		const adTagURL = buildImaAdTagUrl(
			'someAdUnit',
			{
				testParam1: 'hello1',
				testParam2: 'hello2',
				testParam3: ['hello3', 'hello4'],
			},
			{},
		);
		expect(adTagURL).toEqual(
			'https://pubads.g.doubleclick.net/gampad/ads?iu=someAdUnit&description_url=[placeholder]&tfcd=0&npa=0&sz=480x360|480x361|400x300&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=&vad_type=linear&vpos=preroll&cust_params=testParam1%3Dhello1%26testParam2%3Dhello2%26testParam3%3Dhello3%2Chello4',
		);
	});
});
