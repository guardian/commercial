import type { Participations } from '@guardian/ab-core';
import type { ConsentState, CountryCode } from '@guardian/libs';
import { cmp, getCookie, isString } from '@guardian/libs';
//web-vitals is imported after we removed GA because PerformanceNavigationTiming type uses the ambient types in web-vitals
import {} from 'web-vitals';
import { supportsPerformanceAPI } from '../event-timer';
import { getLocale } from '../lib/get-locale';
import type { False, True } from '../types';
import type { ContentTargeting } from './content';
import { getContentTargeting } from './content';
import type { AdManagerGroup, Frequency } from './personalised';
import { getPersonalisedTargeting } from './personalised';
import type { SessionTargeting } from './session';
import { getSessionTargeting } from './session';
import type { SharedTargeting } from './shared';
import { getSharedTargeting } from './shared';
import type { ViewportTargeting } from './viewport';
import { getViewportTargeting } from './viewport';

type PartialWithNulls<T> = { [P in keyof T]?: T[P] | null };

type TrueOrFalse = True | False;

type PageTargeting = PartialWithNulls<
	{
		ab: string[];
		af: 't'; // Ad Free
		amtgrp: AdManagerGroup;
		at: string; // Ad Test
		bp: 'mobile' | 'tablet' | 'desktop'; // BreakPoint
		cc: CountryCode; // Country Code
		cmp_interaction: string;
		consent_tcfv2: string;
		dcre: TrueOrFalse; // DotCom-Rendering Eligible
		fr: Frequency; // FRequency
		inskin: TrueOrFalse; // InSkin
		pa: TrueOrFalse; // Personalised Ads consent
		permutive: string[]; // predefined segment values
		pv: string; // ophan Page View id
		rc: string; // recently published content
		rdp: string;
		ref: string; // REFerrer
		rp: 'dotcom-rendering' | 'dotcom-platform'; // Rendering Platform
		s: string; // site Section
		sens: TrueOrFalse; // SenSitive
		si: TrueOrFalse; // Signed In
		skinsize: 'l' | 's';
		urlkw: string[]; // URL KeyWords
		vl: string; // Video Length
		allkw: string[]; // Concatenated urlkw and k so they can be used in the same targeting key reducing the number of keys

		// And more
		[_: string]: string | string[];
	} & SharedTargeting
>;

const filterValues = (pageTargets: Record<string, unknown>) => {
	const filtered: Record<string, string | string[]> = {};
	for (const key in pageTargets) {
		const value = pageTargets[key];
		if (isString(value)) {
			filtered[key] = value;
		} else if (
			Array.isArray(value) &&
			value.length > 0 &&
			value.every(isString)
		) {
			filtered[key] = value;
		}
	}
	return filtered;
};

const getLastNavigationType = (): NavigationTimingType | undefined => {
	if (!supportsPerformanceAPI()) {
		return undefined;
	}
	const navigationEvents = performance.getEntriesByType('navigation');
	const lastNavigationEvent = navigationEvents[navigationEvents.length - 1];
	return lastNavigationEvent?.type;
};

const referrerMatchesHost = (referrer: string): boolean => {
	if (!referrer) {
		return false;
	}
	const referrerUrl = new URL(referrer);
	return referrerUrl.hostname === window.location.hostname;
};

// A consentless friendly way of determining if this is the users first visit to the page
const isFirstVisit = (referrer: string): boolean => {
	if (supportsPerformanceAPI() && getLastNavigationType() !== 'navigate') {
		return false;
	}

	return !referrerMatchesHost(referrer);
};

type BuildPageTargetingParams = {
	adFree: boolean;
	clientSideParticipations: Participations;
	consentState: ConsentState;
	isSignedIn?: boolean;
	youtube?: boolean;
};

const buildPageTargeting = ({
	adFree,
	clientSideParticipations,
	consentState,
	isSignedIn = false,
	youtube = false,
}: BuildPageTargetingParams): Record<string, string | string[]> => {
	const { page, isDotcomRendering } = window.guardian.config;

	const adFreeTargeting: { af?: True } = adFree ? { af: 't' } : {};

	const sharedAdTargeting = page.sharedAdTargeting
		? getSharedTargeting(page.sharedAdTargeting)
		: {};

	const contentTargeting: ContentTargeting = getContentTargeting({
		webPublicationDate: page.webPublicationDate,
		eligibleForDCR: page.dcrCouldRender,
		path: `/${page.pageId}`,
		renderingPlatform: isDotcomRendering
			? 'dotcom-rendering'
			: 'dotcom-platform',
		section: page.section,
		sensitive: page.isSensitive,
		videoLength: page.videoDuration,
		keywords: sharedAdTargeting.k ?? [],
	});

	const referrer = document.referrer || '';

	const sessionTargeting: SessionTargeting = getSessionTargeting({
		adTest: getCookie({ name: 'adtest', shouldMemoize: true }),
		countryCode: getLocale(),
		isSignedIn,
		pageViewId: window.guardian.config.ophan.pageViewId,
		participations: {
			clientSideParticipations,
			serverSideParticipations: window.guardian.config.tests ?? {},
		},
		referrer,
	});

	type Viewport = { width: number; height: number };

	const getViewport = (): Viewport => {
		return {
			width: window.innerWidth || document.body.clientWidth || 0,
			height: window.innerHeight || document.body.clientHeight || 0,
		};
	};

	const viewportTargeting: ViewportTargeting = getViewportTargeting({
		viewPortWidth: getViewport().width,
		cmpBannerWillShow:
			!cmp.hasInitialised() || cmp.willShowPrivacyMessageSync(),
	});

	const personalisedTargeting = getPersonalisedTargeting({
		state: consentState,
		youtube,
	});

	const consentlessTargeting: Partial<PageTargeting> = {};

	if (!consentState.canTarget) {
		consentlessTargeting.firstvisit = isFirstVisit(referrer) ? 't' : 'f';
	}

	const pageTargets: PageTargeting = {
		...personalisedTargeting,
		...sharedAdTargeting,
		...adFreeTargeting,
		...contentTargeting,
		...sessionTargeting,
		...viewportTargeting,
		...consentlessTargeting,
	};

	// filter !(string | string[]) and empty values
	const pageTargeting = filterValues(pageTargets);

	return pageTargeting;
};

export { buildPageTargeting, filterValues };
export type { PageTargeting };
