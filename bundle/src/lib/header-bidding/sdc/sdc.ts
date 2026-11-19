import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import { getCookie, isObject, log, storage } from '@guardian/libs';
import type {
	Inline1Payload,
	Inline1Props,
	MessageViewLog,
	TestTracking,
} from '@guardian/support-dotcom-components/dist/shared/types';
import type { Advert } from '../../../define/Advert';
import { adSlotIdPrefix } from '../../dfp/dfp-env-globals';
import { isUserLoggedIn } from '../../identity/api';
import {
	getAuthHeaders,
	getHasConsented,
	shouldHideSupportMessaging,
} from './contributions';

interface ModuleData<PROPS> {
	name: string;
	props: PROPS;
}

interface ModuleDataResponse<PROPS> {
	data?: {
		module: ModuleData<PROPS>;
		meta: TestTracking;
		bid?: string;
	};
}

type ModuleType = 'inline1';

const getForcedVariant = (type: ModuleType): string | null => {
	const params = new URLSearchParams(window.location.search);
	return params.get(`force-${type}`);
};

const getPreviewVariant = (type: ModuleType): string | null => {
	const params = new URLSearchParams(window.location.search);
	return params.get(`preview-${type}`);
};

const isInline1Preview = (): boolean => getPreviewVariant('inline1') !== null;
const buildSDCUrl = (baseUrl: string, type: ModuleType): string => {
	const forcedVariant = getForcedVariant(type);
	const previewVariant = getPreviewVariant(type);

	const queryParams = new URLSearchParams();
	if (forcedVariant) {
		queryParams.set('force', forcedVariant);
	}
	if (previewVariant !== null) {
		queryParams.set('preview', previewVariant);
	}

	const queryString = queryParams.toString();
	return queryString
		? `${baseUrl}/${type}?${queryString}`
		: `${baseUrl}/${type}`;
};

const getModuleData = async <PROPS>(
	type: ModuleType,
	baseUrl: string,
	payload: Inline1Payload,
	headers?: HeadersInit,
): Promise<ModuleDataResponse<PROPS>> => {
	const url = buildSDCUrl(baseUrl, type);
	const response = await fetch(url, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		throw Error(
			response.statusText ||
				`Supporter Revenue ${type} | Api call returned HTTP status ${response.status}`,
		);
	}
	return await response.json();
};

const getBrowserId = (userHasConsent: boolean): string | undefined => {
	if (!userHasConsent) {
		return undefined;
	}
	return getCookie({ name: 'bwid', shouldMemoize: true }) ?? undefined;
};

const getMvtId = (): number => {
	const cookieVal = getCookie({ name: 'GU_mvt_id', shouldMemoize: true });
	if (cookieVal) {
		return Number(cookieVal);
	}
	return 0;
};

const getViewLog = (): MessageViewLog => {
	const item = storage.local.get('gu.inline1.views');
	if (Array.isArray(item)) {
		return item as MessageViewLog;
	}
	return [];
};

const SDC_URL_CODE = 'https://contributions.code.dev-guardianapis.com';
const SDC_URL_PROD = 'https://contributions.guardianapis.com';

const getSdcUrl = (): string => {
	if (process.env.SDC_URL) return process.env.SDC_URL;
	return window.guardian.config.page.isDev ? SDC_URL_CODE : SDC_URL_PROD;
};

const fetchBid = async (): Promise<ModuleDataResponse<Inline1Props>> => {
	const sdcUrl = getSdcUrl();
	const hasConsented = await getHasConsented();
	const isSignedIn = await isUserLoggedIn();
	const payload = {
		targeting: {
			showSupportMessaging: !shouldHideSupportMessaging(isSignedIn),
			mvtId: getMvtId(),
			countryCode: getLocale(),
			sectionId: window.guardian.config.page.section,
			tagIds: window.guardian.config.page.keywordIds.split(','),
			pageId: window.guardian.config.page.pageId,
			browserId: getBrowserId(hasConsented),
			isSignedIn: isSignedIn,
			hasConsented: hasConsented,
			hasNewsletterSignup:
				window.guardian.config.page.promotedNewsletter !== undefined,
			viewLog: getViewLog(),
		},
	};

	const authHeaders = await getAuthHeaders(hasConsented);

	const response: ModuleDataResponse<Inline1Props> = await getModuleData(
		'inline1',
		sdcUrl,
		payload,
		authHeaders,
	);

	log('commercial', '[NBA] SDC bid response', response);

	return response;
};

const setSlotTargeting = (
	advert: Advert,
	responseData: ModuleDataResponse<Inline1Props>['data'],
): void => {
	if (responseData) {
		const isPreview = isInline1Preview();

		// Set targeting on slot
		advert.slot.setConfig({
			targeting: {
				nba_id: responseData.meta.campaignCode,
				...(isPreview
					? { nba_preview: 'true' }
					: { nba_pb: responseData.bid ?? '' }),
			},
		});
	}
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
	new Promise<T>((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error(`Timed out after ${ms}ms`)),
			ms,
		);
		promise.then(resolve, reject).finally(() => clearTimeout(timer));
	});

// Store the result of the request to SDC
let bidPromise: Promise<Inline1Props | null> | undefined;

const SDC_TIMEOUT_IN_MILLIS = 1500;

const requestBids = async (advert: Advert): Promise<void> => {
	// Only make the request once
	if (bidPromise) {
		await bidPromise;
		return;
	}

	bidPromise = withTimeout(fetchBid(), SDC_TIMEOUT_IN_MILLIS)
		.then((response) => {
			if (response.data) {
				setSlotTargeting(advert, response.data);
				return response.data.module.props;
			}
			return null;
		})
		.catch((error: unknown) => {
			console.error('[NBA] SDC bid request failed', error);
			return null;
		});

	await bidPromise;
};

interface SdcRenderSpecs {
	id: string;
	pb?: string;
}

const isValidSdcRenderMessage = (specs: unknown): specs is SdcRenderSpecs => {
	return isObject(specs) && 'id' in specs;
};

// If SDC wins the auction then the creative posts a message, triggering this callback.
// Here we post a custom event to the DCR page with the SDC data.
const onCreativeRender = async (event: unknown = {}): Promise<void> => {
	if (!isValidSdcRenderMessage(event)) {
		return Promise.resolve();
	}

	log(
		'commercial',
		'[NBA] Event received from creative',
		JSON.stringify(event),
	);
	const props = await bidPromise;
	if (!props) {
		return;
	}

	// Check if the ID returned from the creative matches the intended ID of the campaign
	if (props.tracking.campaignCode !== event.id) {
		log(
			'commercial',
			`ID from creative ${event.id} does not match SDC response ${props.tracking.campaignCode}`,
		);
		return;
	}

	const slotId = `${adSlotIdPrefix}inline1`;
	const adSlotNode = document.getElementById(slotId);
	// Set on the window as well as dispatching, in case DCR's listener isn't ready yet
	(window.guardian.commercial ??= {}).sdc = { inline1: { props, slotId } };
	adSlotNode?.dispatchEvent(
		new CustomEvent('commercial.sdc-render', {
			detail: { props },
			bubbles: true,
		}),
	);
};

export const sdc = {
	isInline1Preview,
	requestBids,
	onCreativeRender,
};

// For testing
export const _ = {
	SDC_TIMEOUT_IN_MILLIS,
	reset: (): void => {
		bidPromise = undefined;
	},
};
