import type { ConsentState } from '@guardian/libs';
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
	window.guardian = {
		config: {
			page: {
				host: 'https://www.theguardian.com',
				pageId: 'sport/video/2024/oct/10/tennis-rafael-nadal-announces-retirement',
			},
		},
	} as typeof window.guardian;

	it('default values and empty custom parameters', () => {
		(buildPageTargeting as jest.Mock).mockReturnValue({
			at: 'adTestValue',
		});
		const adTagURL = buildImaAdTagUrl({
			adUnit: 'someAdUnit',
			customParams: {},
			consentState: emptyConsent,
			clientSideParticipations: {},
			isSignedIn: true,
		});
		expect(adTagURL).toEqual(
			'https://securepubads.g.doubleclick.net/gampad/ads?iu=someAdUnit&tfcd=0&npa=0&sz=480x360|480x361|400x300&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&vad_type=linear&vpos=preroll&plcmt=1&description_url=https%3A%2F%2Fwww.theguardian.com%2Fsport%2Fvideo%2F2024%2Foct%2F10%2Ftennis-rafael-nadal-announces-retirement&cust_params=at%3DadTestValue',
		);
	});
	it('encodes custom parameters', () => {
		(buildPageTargeting as jest.Mock).mockReturnValue({
			at: 'fixed-puppies',
			encodeMe: '=&,',
		});
		const adTagURL = buildImaAdTagUrl({
			adUnit: '/59666047/theguardian.com',
			customParams: {
				param1: 'hello1',
				param2: 'hello2',
				param3: ['hello3', 'hello4'],
				param4: true, // not a string so filtered out by filterValues
				param5: 5, // not a string so filtered out by filterValues
				param6: '=&,',
			},
			consentState: emptyConsent,
			clientSideParticipations: {},
			isSignedIn: true,
		});
		expect(adTagURL).toEqual(
			// this is a real ad tag url that you can paste into Google's VAST tag checker:
			// https://googleads.github.io/googleads-ima-html5/vsi/
			'https://securepubads.g.doubleclick.net/gampad/ads?iu=/59666047/theguardian.com&tfcd=0&npa=0&sz=480x360|480x361|400x300&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&vad_type=linear&vpos=preroll&plcmt=1&description_url=https%3A%2F%2Fwww.theguardian.com%2Fsport%2Fvideo%2F2024%2Foct%2F10%2Ftennis-rafael-nadal-announces-retirement&cust_params=param1%3Dhello1%26param2%3Dhello2%26param3%3Dhello3%252Chello4%26param6%3D%253D%2526%252C%26at%3Dfixed-puppies%26encodeMe%3D%253D%2526%252C',
		);
	});
	it('uses provided custom parameters if page targeting throws an exception', () => {
		(buildPageTargeting as jest.Mock).mockImplementation(() => {
			throw new Error('Error from page targeting!');
		});
		const adTagURL = buildImaAdTagUrl({
			adUnit: '/59666047/theguardian.com',
			customParams: {
				param1: 'hello1',
			},
			consentState: emptyConsent,
			clientSideParticipations: {},
			isSignedIn: true,
		});
		expect(adTagURL).toEqual(
			'https://securepubads.g.doubleclick.net/gampad/ads?iu=/59666047/theguardian.com&tfcd=0&npa=0&sz=480x360|480x361|400x300&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&vad_type=linear&vpos=preroll&plcmt=1&description_url=https%3A%2F%2Fwww.theguardian.com%2Fsport%2Fvideo%2F2024%2Foct%2F10%2Ftennis-rafael-nadal-announces-retirement&cust_params=param1%3Dhello1',
		);
	});
});
