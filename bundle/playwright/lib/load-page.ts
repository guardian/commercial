import type { Cookie } from '@playwright/test';
import { type Page } from '@playwright/test';

const ORIGIN = `http://localhost:3030`;

// Log commercial logs to playwight console
const LOG_COMMERCIAL = false;

type FrontendModel = {
	config: {
		switches: Record<string, unknown>;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

type LoadPageOptions = {
	queryParams?: Record<string, string>;
	queryParamsOn?: boolean;
	fragment?: `#${string}`;
	waitUntil?: 'domcontentloaded' | 'load';
	region?: 'GB' | 'US' | 'AU' | 'INT';
	preventSupportBanner?: boolean;
	overrides?: {
		configOverrides?: Record<string, unknown>;
		switchOverrides?: Record<string, unknown>;
		feFixture?: FrontendModel;
	};
};

type LoadPageParams = {
	page: Page;
	path: string;
} & LoadPageOptions;

type ContentType = 'article' | 'liveblog' | 'front' | 'tagPage';

const getDcrContentType = (
	type: ContentType,
): 'Article' | 'Front' | 'TagPage' => {
	switch (type) {
		case 'front':
			return 'Front';

		case 'tagPage':
			return 'TagPage';

		default:
			return 'Article';
	}
};

/**
 * Generate the path for the request to DCR
 * e.g. Article/https://www.theguardian.com/article/2023/oct/01/example-article
 */
const getPath = (type: ContentType = 'article', path: string) => {
	const dcrContentType = getDcrContentType(type);
	return `${dcrContentType}/https://www.theguardian.com${path}`;
};

/**
 * Generate a full DCR URL i.e domain and path
 */
const getTestUrl = ({
	path,
	type = 'article',
	adtest = 'fixed-puppies-ci',
}: {
	path: string;
	type?: ContentType;
	adtest?: string;
}) => {
	const url = new URL(getPath(type, path), ORIGIN);
	if (type === 'liveblog') {
		url.searchParams.append('live', '1');
	}
	url.searchParams.append('adtest', adtest);
	// force an invalid epic so it is not shown
	url.searchParams.append('force-epic', '9999:CONTROL');
	return url.toString();
};

/**
 * @param path The path for a DCR endpoint path
 *		e.g. `/Article/https://www.theguardian.com/world/2025/aug/19/the-big-church-move-sweden-kiruna-kyrka`
 * @returns The Frontend URL to fetch the JSON payload
 *		e.g. `https://www.theguardian.com/world/2025/aug/19/the-big-church-move-sweden-kiruna-kyrka.json`
 */
const getFrontendJsonUrl = (path: string) => {
	const secondSlashIndex = path.indexOf('/', 1);
	const contentUrl = path.substring(secondSlashIndex + 1);
	return `${contentUrl}.json`;
};

/**
 * @param path The path for a DCR endpoint path
 *		e.g. `/Article/https://www.theguardian.com/world/2025/aug/19/the-big-church-move-sweden-kiruna-kyrka`
 * @param cookies Cookies to send with the request
 *		e.g. `GU_EDITION=US`
 * @param queryParams Query parameters to append to the request
 *		e.g. `live=true` for live blogs
 * @returns The JSON response from the Frontend URL
 */
const getFrontendJson = async (
	path: string,
	cookies: Cookie[],
	queryParams: LoadPageParams['queryParams'],
): Promise<unknown> => {
	try {
		const paramsString = `${new URLSearchParams({
			dcr: 'true',
			...queryParams,
		}).toString()}`;
		const frontendUrl = `${getFrontendJsonUrl(path)}?${paramsString}`;
		const cookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
		const response = await fetch(frontendUrl, { headers: { cookie } });
		if (!response.ok) {
			throw new Error(
				`Failed to fetch from ${path}: ${response.statusText}`,
			);
		}
		return response.json();
	} catch (error) {
		throw new Error(
			`Error fetching from ${path}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
};

/**
 * Constructs a DCR URL for a given path and query parameters.
 * @param params The parameters for constructing the DCR URL
 * @param params.path The path for a DCR endpoint
 * @param params.queryParamsOn Whether to append query parameters to the URL
 * @param params.queryParams Query parameters to append to the request
 * @returns The DCR URL
 * e.g. `http://localhost:9000/Article/https://theguardian.com/sport/live/2022/mar/27/west-indies-v-england-third-test-day-four-live?adtest=fixed-puppies-ci&live=true&force-liveblog-epic=true`
 */
const getDcrUrl = ({
	path,
	queryParamsOn,
	queryParams,
}: Pick<LoadPageParams, 'path' | 'queryParamsOn' | 'queryParams'>): string => {
	const paramsString = queryParamsOn
		? `?${new URLSearchParams({
				adtest: 'fixed-puppies-ci',
				...queryParams,
			}).toString()}`
		: '';
	return `${ORIGIN}${path}${paramsString}`;
};

/**
 * Constructs a DCR POST URL for a given path.
 * @param path The path for a DCR endpoint
 *		e.g. `/Article/https://www.theguardian.com/world/2025/aug/19/the-big-church-move-sweden-kiruna-kyrka`
 * @returns The DCR POST URL to send the request to
 *		e.g. `http://localhost:9000/Article`
 *		This is used to override the request method to POST in Playwright tests.
 */
const getDcrPostUrl = (path: string) => `${ORIGIN}/${path.split('/')[1]}`;

const getSlotName = (url: string) => {
	const adRequest = new URL(url);
	const adRequestParams = adRequest.searchParams;
	const prevScp = new URLSearchParams(adRequestParams.get('prev_scp') ?? '');
	return prevScp.get('slot') ?? 'unknown';
};

// Warn if any slots are unfilled
const logUnfilledSlots = (page: Page) => {
	page.on('response', (response) => {
		const url = response.url();

		if (url.includes('securepubads.g.doubleclick.net/gampad/ads')) {
			const lineItemId = response.headers()['google-lineitem-id'] ?? '';
			const creativeId = response.headers()['google-creative-id'] ?? '';

			if (
				!lineItemId ||
				!creativeId ||
				lineItemId === '-2' ||
				creativeId === '-2'
			) {
				console.warn(`Unfilled slot: ${getSlotName(url)}`);
			}
		}
	});
};

// Log commercial logs to playwight console
const logCommercial = (page: Page) => {
	page.on('console', (msg) => {
		const label = JSON.stringify(msg.args()[0]);
		if (label.includes('commercial')) {
			console.log(msg.args().slice(4).map(String).join(' '));
		}
	});
};

/**
 * Loads a page in Playwright and centralises setup
 */
const loadPage = async ({
	page,
	path,
	queryParams = {},
	queryParamsOn = true,
	fragment,
	waitUntil = 'domcontentloaded',
	region = 'GB',
	overrides = {},
}: LoadPageParams): Promise<void> => {
	await page.addInitScript(
		(args) => {
			// Set the geo region, defaults to GB
			window.localStorage.setItem(
				'gu.geo.override',
				JSON.stringify({ value: args.region }),
			);
			// Prevent the support banner from showing
			window.localStorage.setItem(
				'gu.prefs.engagementBannerLastClosedAt',
				`{"value":"${new Date().toISOString()}"}`,
			);
			// subscribe to commercial logger
			window.localStorage.setItem('gu.logger', '{"value":"commercial"}');
		},
		{
			region,
		},
	);

	logUnfilledSlots(page);

	if (LOG_COMMERCIAL) {
		logCommercial(page);
	}

	const cookies = await page.context().cookies();

	// If overrides exist, but no fixture is provided we fetch it from Frontend
	const frontendModel: FrontendModel = await (overrides.feFixture
		? Promise.resolve(overrides.feFixture as FrontendModel)
		: (getFrontendJson(
				path,
				cookies,
				queryParams,
			) as Promise<FrontendModel>));

	// Apply the config and switch overrides
	const postData = {
		...frontendModel,
		config: {
			...frontendModel.config,
			...overrides.configOverrides,
			switches: {
				...frontendModel.config.switches,
				...overrides.switchOverrides,
			},
		},
	};

	const dcrUrl = getDcrUrl({
		path,
		queryParamsOn,
		queryParams,
	});

	// Override any request matching dcrUrl to use a POST method
	// with the overridden payload
	await page.route(dcrUrl, async (route) => {
		await route.continue({
			method: 'POST',
			headers: {
				...route.request().headers(),
				'Content-Type': 'application/json',
			},
			postData,
			url: getDcrPostUrl(path),
		});
	});

	// Initiate the page load
	// Add the fragment here as Playwright has an issue when matching urls
	// with fragments in the page.route handler
	await page.goto(`${dcrUrl}${fragment ?? ''}`, { waitUntil });
};

export { loadPage };
