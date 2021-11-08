import { cmp, onConsentChange } from '@guardian/consent-management-platform';
import type {
	Callback,
	ConsentState,
} from '@guardian/consent-management-platform/dist/types';
import { initAdTargeting, onAdTargetingUpdate } from '.';

jest.mock('@guardian/consent-management-platform', () => ({
	onConsentChange: jest.fn(),
	cmp: {
		willShowPrivacyMessage: jest.fn(),
	},
}));
const mockOnConsentChange = onConsentChange as jest.MockedFunction<
	typeof onConsentChange
>;
const mockCmp = {
	willShowPrivacyMessage: cmp.willShowPrivacyMessage as jest.MockedFunction<
		typeof cmp.willShowPrivacyMessage
	>,
};

const mockState = (state: ConsentState) => (cb: Callback) => cb(state);

const tcfv2WithConsentMock = mockState({
	tcfv2: {
		consents: {
			1: true,
			2: true,
		},
		eventStatus: 'useractioncomplete',
		vendorConsents: { abc: false },
		addtlConsent: 'xyz',
		gdprApplies: true,
		tcString: 'I<3IAB.tcf.ftw',
	},
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- placeholder
const ausConsented = mockState({
	aus: { personalisedAdvertising: true },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- placeholder
const CCPAWithConsent = (cb: Callback) => {
	cb({
		ccpa: { doNotSell: false },
	});
};

describe('initAdTargeting', () => {
	it('can initialise with dummy values', async () => {
		mockOnConsentChange.mockImplementation(tcfv2WithConsentMock);
		mockCmp.willShowPrivacyMessage.mockResolvedValue(false);

		initAdTargeting({
			unsure: {
				gdncrm: ['a', 'b', 'c'],
				ms: 'something',
				slot: 'top-above-nav',
				x: 'Krux-ID',
			},
			content: {
				bl: ['a', 'b'],
				br: 'f',
				co: ['Max Duval'],
				ct: 'article',
				dcre: 'f',
				edition: 'uk',
				k: ['a', 'b'],
				ob: null,
				p: 'ng',
				rp: 'dotcom-platform',
				s: 'uk-news',
				se: ['one'],
				sens: 'f',
				su: '0',
				tn: 'something',
				url: '/some/thing',
				urlkw: ['a', 'b'],
				vl: '60',
			},
			session: {
				at: null,
				cc: 'GB',
				pv: '123457',
				si: 'f',
			},
			participations: {
				clientSideParticipations: {
					'ab-new-ad-targeting': {
						variant: 'variant',
					},
				},
				serverSideParticipations: {},
			},
		});

		global.dispatchEvent(new Event('resize'));

		return onAdTargetingUpdate((targeting) => {
			console.warn('we triggered once with', targeting);
			// TODO: Match everything
			expect(targeting).toMatchObject({
				at: null,
				ab: ['ab-new-ad-targeting-variant'],
				si: 'f',
				co: ['Max Duval'],
				rp: 'dotcom-platform',
			});
		});
	});
});
