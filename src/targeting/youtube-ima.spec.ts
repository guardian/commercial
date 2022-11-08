import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { buildPageTargeting } from './build-page-targeting';
import { buildImaAdTagUrl } from './youtube-ima';

jest.mock('./build-page-targeting', () => ({
	// we want the real filterValues()
	...jest.requireActual('./build-page-targeting'),
	buildPageTargeting: jest.fn(),
}));

const emptyConsent: ConsentState = {
	canTarget: false,
	framework: null,
};

describe('Builds an IMA ad tag URL', () => {
	it('default values and empty custom parameters', () => {
		(buildPageTargeting as jest.Mock).mockReturnValue({
			at: 'adTestValue',
		})
		const adTagURL = buildImaAdTagUrl('someAdUnit', {}, emptyConsent);
		expect(adTagURL).toEqual(
			'https://pubads.g.doubleclick.net/gampad/ads?iu=someAdUnit&description_url=[placeholder]&tfcd=0&npa=0&sz=480x360|480x361|400x300&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=&vad_type=linear&vpos=preroll&cust_params=at%3DadTestValue',
		);
	});
	it('default values and encoded custom parameters', () => {
		(buildPageTargeting as jest.Mock).mockReturnValue({
			at: 'fixed-puppies',
			encodeMe: '=&,'
		})
		const adTagURL = buildImaAdTagUrl('/59666047/theguardian.com', {
			param1: 'hello1',
			param2: 'hello2',
			param3: ['hello3', 'hello4'],
			param4: true, // not a string so filtered out by filterValues
			param5: 5, // not a string so filtered out by filterValues
			param6: '=&,',
		}, emptyConsent);
		expect(adTagURL).toEqual(
			// this is a real ad tag url that you can paste into Google's VAST tag checker:
			// https://googleads.github.io/googleads-ima-html5/vsi/
			'https://pubads.g.doubleclick.net/gampad/ads?iu=/59666047/theguardian.com&description_url=[placeholder]&tfcd=0&npa=0&sz=480x360|480x361|400x300&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=&vad_type=linear&vpos=preroll&cust_params=param1%3Dhello1%26param2%3Dhello2%26param3%3Dhello3%252Chello4%26param6%3D%253D%2526%252C%26at%3Dfixed-puppies%26encodeMe%3D%253D%2526%252C',
		);
	});
});
