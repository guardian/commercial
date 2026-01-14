import type { AllParticipations, SessionTargeting } from './session';
import { getSessionTargeting } from './session';

describe('Session targeting', () => {
	test('No participations', () => {
		const expected: SessionTargeting = {
			ab: null,
			at: null,
			cc: 'GB',
			lh: '12',
			pv: '1234567',
			ref: null,
			si: 'f',
			idp: [],
		};

		const targeting = getSessionTargeting({
			referrer: '',
			participations: {
				serverSideParticipations: {},
				clientSideParticipations: {},
				betaAbTestParticipations: {},
			},
			adTest: null,
			pageViewId: '1234567',
			countryCode: 'GB',
			localHour: '12',
			isSignedIn: false,
			idProviders: [],
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
			betaAbTestParticipations: {
				'ab-new-ad-targeting': 'variant',
			},
		};

		const expected: SessionTargeting = {
			ab: [
				'ab-new-ad-targeting-variant',
				'abStandaloneBundleVariant-variant',
				'ab-new-ad-targeting-variant',
			],
			at: null,
			cc: 'GB',
			lh: '12',
			pv: '1234567',
			ref: null,
			si: 'f',
			idp: [],
		};

		const targeting = getSessionTargeting({
			referrer: '',
			participations,
			adTest: null,
			pageViewId: '1234567',
			countryCode: 'GB',
			localHour: '12',
			isSignedIn: false,
			idProviders: [],
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
			lh: '12',
			pv: '1234567',
			si: 'f',
			ref,
			idp: [],
		};

		const targeting = getSessionTargeting({
			referrer,
			participations: {
				serverSideParticipations: {},
				clientSideParticipations: {},
				betaAbTestParticipations: {},
			},
			adTest: null,
			pageViewId: '1234567',
			countryCode: 'GB',
			localHour: '12',
			isSignedIn: false,
			idProviders: [],
		});
		expect(targeting).toMatchObject(expected);
	});

	const signedInOptions: Array<[boolean, SessionTargeting['si']]> = [
		[true, 't'],
		[false, 'f'],
	];

	test.each(signedInOptions)(
		'should get `%s` for isSignedIn: %s',
		(isSignedIn, si) => {
			const expected: Pick<SessionTargeting, 'si'> = {
				si,
			};

			const targeting = getSessionTargeting({
				referrer: '',
				participations: {
					serverSideParticipations: {},
					clientSideParticipations: {},
					betaAbTestParticipations: {},
				},
				adTest: null,
				pageViewId: '1234567',
				countryCode: 'GB',
				localHour: '12',
				isSignedIn,
				idProviders: [],
			});
			expect(targeting).toMatchObject(expected);
		},
	);

	const idProvidersOptions: Array<
		[SessionTargeting['idp'], Array<{ name: string }>]
	> = [
		[[], []],
		[['sharedId'], [{ name: 'sharedId' }]],
		[
			['sharedId', 'id5Id'],
			[{ name: 'sharedId' }, { name: 'id5Id' }],
		],
		[
			['sharedId', 'id5Id', 'euid'],
			[{ name: 'sharedId' }, { name: 'id5Id' }, { name: 'euid' }],
		],
	];

	test.each(idProvidersOptions)(
		'should get `%s` for idProviders: %s',
		(idp, idProviders) => {
			const expected: Pick<SessionTargeting, 'idp'> = {
				idp,
			};

			const targeting = getSessionTargeting({
				referrer: '',
				participations: {
					serverSideParticipations: {},
					clientSideParticipations: {},
					betaAbTestParticipations: {},
				},
				adTest: null,
				pageViewId: '1234567',
				countryCode: 'GB',
				localHour: '12',
				isSignedIn: false,
				idProviders,
			});
			expect(targeting).toMatchObject(expected);
		},
	);
});
