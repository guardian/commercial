import type { AllParticipations, SessionTargeting } from './session';
import { getSessionTargeting } from './session';

describe('Session targeting', () => {
	test('No participations', () => {
		const expected: SessionTargeting = {
			ab: null,
			at: null,
			cc: 'GB',
			pv: '1234567',
			ref: null,
			si: 'f',
		};

		const targeting = getSessionTargeting({
			referrer: '',
			participations: {
				serverSideParticipations: {},
				clientSideParticipations: {},
			},
			adTest: null,
			pageViewId: '1234567',
			countryCode: 'GB',
			isSignedIn: false,
		});
		expect(targeting).toMatchObject(expected);
	});

	test('With participations', () => {
		const participations: AllParticipations = {
			clientSideParticipations: {
				'ab-new-ad-targeting': {
					variant: 'variant',
				},
				'ab-some-other-test': {
					variant: 'notintest',
				},
			},
			serverSideParticipations: {
				abStandaloneBundleVariant: 'variant',
			},
		};

		const expected: SessionTargeting = {
			ab: [
				'ab-new-ad-targeting-variant',
				'abStandaloneBundleVariant-variant',
			],
			at: null,
			cc: 'GB',
			pv: '1234567',
			ref: null,
			si: 'f',
		};

		const targeting = getSessionTargeting({
			referrer: '',
			participations,
			adTest: null,
			pageViewId: '1234567',
			countryCode: 'GB',
			isSignedIn: false,
		});
		expect(targeting).toMatchObject(expected);
	});

	const referrers: Array<[SessionTargeting['ref'], `http${string}`]> = [
		['facebook', 'https://www.facebook.com/index.php'],
		['google', 'https:///www.google.com/'],
		['reddit', 'https://www.reddit.com/r/'],
		['twitter', 'https://t.co/sH0RtUr1'],
		[null, 'https://example.com/'],
	];

	test.each(referrers)('should get `%s` for ref: %s', (ref, referrer) => {
		const expected: SessionTargeting = {
			ab: null,
			at: null,
			cc: 'GB',
			pv: '1234567',
			si: 'f',
			ref,
		};

		const targeting = getSessionTargeting({
			referrer,
			participations: {
				serverSideParticipations: {},
				clientSideParticipations: {},
			},
			adTest: null,
			pageViewId: '1234567',
			countryCode: 'GB',
			isSignedIn: false,
		});
		expect(targeting).toMatchObject(expected);
	});
});
