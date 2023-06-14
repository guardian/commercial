import { getCookie, setCookie } from '@guardian/libs';
import {
	AdFreeCookieReasons,
	maybeUnsetAdFreeCookie,
} from './manage-ad-free-cookie';

const VALID_EXPIRY = String(new Date().getTime() + 10000);
const EXPIRED_EXPIRY = String(new Date().getTime() - 10000);

describe('manage-ad-free-cookie', () => {
	const SHOULD_UNSET_COOKIE = [
		{
			reason: AdFreeCookieReasons.Subscriber,
			localStorageValue: {
				[AdFreeCookieReasons.Subscriber]: VALID_EXPIRY,
			},
		},
		{
			reason: AdFreeCookieReasons.Subscriber,
			localStorageValue: undefined,
		},
	];

	it.each(SHOULD_UNSET_COOKIE)(
		`maybeUnsetAdFreeCookie($reason) should unset the cookie`,
		({ reason, localStorageValue }) => {
			setCookie({
				name: 'GU_AF1',
				value: VALID_EXPIRY,
				daysToLive: 1,
			});

			if (localStorageValue) {
				localStorage.setItem(
					'gu.ad_free_cookie_reason',
					JSON.stringify(localStorageValue),
				);
			} else {
				localStorage.removeItem('gu.ad_free_cookie_reason');
			}

			maybeUnsetAdFreeCookie(reason);

			expect(getCookie({ name: 'GU_AF1' })).toBeNull();
		},
	);

	const SHOULD_NOT_UNSET_COOKIE = [
		{
			reason: AdFreeCookieReasons.Subscriber,
			localStorageValue: {
				[AdFreeCookieReasons.Subscriber]: VALID_EXPIRY,
				[AdFreeCookieReasons.ForceAdFree]: VALID_EXPIRY,
			},
		},
		{
			reason: AdFreeCookieReasons.Subscriber,
			localStorageValue: {
				[AdFreeCookieReasons.Subscriber]: EXPIRED_EXPIRY,
				[AdFreeCookieReasons.ForceAdFree]: VALID_EXPIRY,
			},
		},
	];

	it.each(SHOULD_NOT_UNSET_COOKIE)(
		'maybeUnsetAdFreeCookie($reason) should not unset the cookie',
		({ reason, localStorageValue }) => {
			setCookie({
				name: 'GU_AF1',
				value: VALID_EXPIRY,
				daysToLive: 1,
			});

			localStorage.setItem(
				'gu.ad_free_cookie_reason',
				JSON.stringify(localStorageValue),
			);

			maybeUnsetAdFreeCookie(reason);

			expect(getCookie({ name: 'GU_AF1' })).not.toBeNull();
		},
	);
});
