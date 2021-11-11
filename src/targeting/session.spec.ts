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

		const targeting = getSessionTargeting(
			{
				serverSideParticipations: {},
				clientSideParticipations: {},
			},
			{ at: null, pv: '1234567', cc: 'GB', si: 'f' },
		);
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
				abStandaloneBundle: 'variant',
			},
		};

		const expected: SessionTargeting = {
			ab: ['ab-new-ad-targeting-variant', 'abStandaloneBundle-variant'],
			at: null,
			cc: 'GB',
			pv: '1234567',
			ref: null,
			si: 'f',
		};

		const targeting = getSessionTargeting(participations, {
			at: null,
			pv: '1234567',
			cc: 'GB',
			si: 'f',
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
		Object.defineProperty(document, 'referrer', {
			value: referrer,
			configurable: true,
		});

		const expected: SessionTargeting = {
			ab: null,
			at: null,
			cc: 'GB',
			pv: '1234567',
			si: 'f',
			ref,
		};

		const targeting = getSessionTargeting(
			{ serverSideParticipations: {}, clientSideParticipations: {} },
			{
				at: null,
				pv: '1234567',
				cc: 'GB',
				si: 'f',
			},
		);
		expect(targeting).toMatchObject(expected);
	});
});
