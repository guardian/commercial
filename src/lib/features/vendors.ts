import { once } from 'lodash-es';
import { adFree, isSecureContact } from './core';
import { type FeatureFlag, isUserPrefsAdsOff } from './utils';

export const thirdPartyTags: FeatureFlag = once(() => {
	// this is used for SpeedCurve tests
	const noadsUrl = /[#&]noads(&.*)?$/.test(window.location.hash);
	const externalAdvertising = !noadsUrl && !isUserPrefsAdsOff();
	const isIdentityPage =
		window.guardian.config.page.contentType === 'Identity' ||
		window.guardian.config.page.section === 'identity'; // needed for pages under profile.* subdomain

	return (
		!adFree() &&
		externalAdvertising &&
		!isIdentityPage &&
		!isSecureContact()
	);
});

export const youtubeAdvertising: FeatureFlag = once(() => {
	const sensitiveContent =
		window.guardian.config.page.shouldHideAdverts ||
		window.guardian.config.page.section === 'childrens-books-site';
	return !adFree() && !sensitiveContent;
});

export const comscore: FeatureFlag = once(() => {
	const isIdentityPage =
		window.guardian.config.page.contentType === 'Identity' ||
		window.guardian.config.page.section === 'identity'; // needed for pages under profile.* subdomain

	// Feature switches
	return (
		!!window.guardian.config.switches.comscore &&
		!isIdentityPage &&
		!isSecureContact()
	);
});
