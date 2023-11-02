import { addCookie, removeCookie } from 'lib/cookies';
import { isUserLoggedInOktaRefactor as isUserLoggedInOktaRefactor_ } from './identity/api';
import {
	getDaysSinceLastOneOffContribution,
	getLastOneOffContributionTimestamp,
	isAdFreeUser,
	isDigitalSubscriber,
	isPayingMember,
	isRecentOneOffContributor,
	isRecurringContributor,
	shouldNotBeShownSupportMessaging,
} from './user-features';

const isUserLoggedInOktaRefactor =
	isUserLoggedInOktaRefactor_ as jest.MockedFunction<
		typeof isUserLoggedInOktaRefactor_
	>;

jest.mock('lib/identity/api', () => ({
	isUserLoggedInOktaRefactor: jest.fn(),
	getAuthStatus: jest.fn(),
	getOptionsHeadersWithOkta: jest.fn(),
}));
jest.mock('lib/raven');
jest.mock('lib/identity/api', () => ({
	isUserLoggedInOktaRefactor: jest.fn(),
	getAuthStatus: jest.fn(),
	getOptionsHeadersWithOkta: jest.fn(),
}));
jest.mock('lib/utils/fetch-json', () => ({
	fetchJson: jest.fn(() => Promise.resolve()),
}));

const PERSISTENCE_KEYS = {
	USER_FEATURES_EXPIRY_COOKIE: 'gu_user_features_expiry',
	PAYING_MEMBER_COOKIE: 'gu_paying_member',
	RECURRING_CONTRIBUTOR_COOKIE: 'gu_recurring_contributor',
	AD_FREE_USER_COOKIE: 'GU_AF1',
	ACTION_REQUIRED_FOR_COOKIE: 'gu_action_required_for',
	DIGITAL_SUBSCRIBER_COOKIE: 'gu_digital_subscriber',
	SUPPORT_ONE_OFF_CONTRIBUTION_COOKIE: 'gu.contributions.contrib-timestamp',
	ONE_OFF_CONTRIBUTION_DATE_COOKIE: 'gu_one_off_contribution_date',
	HIDE_SUPPORT_MESSAGING_COOKIE: 'gu_hide_support_messaging',
	SUPPORT_MONTHLY_CONTRIBUTION_COOKIE:
		'gu.contributions.recurring.contrib-timestamp.Monthly',
	SUPPORT_ANNUAL_CONTRIBUTION_COOKIE:
		'gu.contributions.recurring.contrib-timestamp.Annual',
};

beforeAll(() => {
	window.guardian.config.page.userAttributesApiUrl = '';
});

describe('The isAdFreeUser getter', () => {
	it('Is false when the user is logged out', () => {
		jest.resetAllMocks();
		isUserLoggedInOktaRefactor.mockResolvedValue(false);
		expect(isAdFreeUser()).toBe(false);
	});
});

describe('The isPayingMember getter', () => {
	it('Is false when the user is logged out', async () => {
		jest.resetAllMocks();
		isUserLoggedInOktaRefactor.mockResolvedValue(false);
		expect(await isPayingMember()).toBe(false);
	});

	describe('When the user is logged in', () => {
		beforeEach(() => {
			jest.resetAllMocks();
			isUserLoggedInOktaRefactor.mockResolvedValue(true);
		});

		it('Is true when the user has a `true` paying member cookie', async () => {
			addCookie(PERSISTENCE_KEYS.PAYING_MEMBER_COOKIE, 'true');
			expect(await isPayingMember()).toBe(true);
		});

		it('Is false when the user has a `false` paying member cookie', async () => {
			addCookie(PERSISTENCE_KEYS.PAYING_MEMBER_COOKIE, 'false');
			expect(await isPayingMember()).toBe(false);
		});

		it('Is true when the user has no paying member cookie', async () => {
			// If we don't know, we err on the side of caution, rather than annoy paying users
			removeCookie(PERSISTENCE_KEYS.PAYING_MEMBER_COOKIE);
			expect(await isPayingMember()).toBe(true);
		});
	});
});

describe('The isRecurringContributor getter', () => {
	it('Is false when the user is logged out', async () => {
		jest.resetAllMocks();
		isUserLoggedInOktaRefactor.mockResolvedValue(false);
		expect(await isRecurringContributor()).toBe(false);
	});

	describe('When the user is logged in', () => {
		beforeEach(() => {
			jest.resetAllMocks();
			isUserLoggedInOktaRefactor.mockResolvedValue(true);
		});

		it('Is true when the user has a `true` recurring contributor cookie', async () => {
			addCookie(PERSISTENCE_KEYS.RECURRING_CONTRIBUTOR_COOKIE, 'true');
			expect(await isRecurringContributor()).toBe(true);
		});

		it('Is false when the user has a `false` recurring contributor cookie', async () => {
			addCookie(PERSISTENCE_KEYS.RECURRING_CONTRIBUTOR_COOKIE, 'false');
			expect(await isRecurringContributor()).toBe(false);
		});

		it('Is true when the user has no recurring contributor cookie', async () => {
			// If we don't know, we err on the side of caution, rather than annoy paying users
			removeCookie(PERSISTENCE_KEYS.RECURRING_CONTRIBUTOR_COOKIE);
			expect(await isRecurringContributor()).toBe(true);
		});
	});
});

describe('The isDigitalSubscriber getter', () => {
	it('Is false when the user is logged out', () => {
		jest.resetAllMocks();
		isUserLoggedInOktaRefactor.mockResolvedValue(false);
		expect(isDigitalSubscriber()).toBe(false);
	});

	describe('When the user is logged in', () => {
		beforeEach(() => {
			jest.resetAllMocks();
			isUserLoggedInOktaRefactor.mockResolvedValue(true);
		});

		it('Is true when the user has a `true` digital subscriber cookie', () => {
			addCookie(PERSISTENCE_KEYS.DIGITAL_SUBSCRIBER_COOKIE, 'true');
			expect(isDigitalSubscriber()).toBe(true);
		});

		it('Is false when the user has a `false` digital subscriber cookie', () => {
			addCookie(PERSISTENCE_KEYS.DIGITAL_SUBSCRIBER_COOKIE, 'false');
			expect(isDigitalSubscriber()).toBe(false);
		});

		it('Is false when the user has no digital subscriber cookie', () => {
			removeCookie(PERSISTENCE_KEYS.DIGITAL_SUBSCRIBER_COOKIE);
			expect(isDigitalSubscriber()).toBe(false);
		});
	});
});

describe('The shouldNotBeShownSupportMessaging getter', () => {
	it('Returns false when the user is logged out', () => {
		jest.resetAllMocks();
		isUserLoggedInOktaRefactor.mockResolvedValue(false);
		expect(shouldNotBeShownSupportMessaging()).toBe(false);
	});

	describe('When the user is logged in', () => {
		beforeEach(() => {
			jest.resetAllMocks();
			isUserLoggedInOktaRefactor.mockResolvedValue(true);
		});

		it('Returns true when the user has a `true` hide support messaging cookie', () => {
			addCookie(PERSISTENCE_KEYS.HIDE_SUPPORT_MESSAGING_COOKIE, 'true');
			expect(shouldNotBeShownSupportMessaging()).toBe(true);
		});

		it('Returns false when the user has a `false` hide support messaging cookie', () => {
			addCookie(PERSISTENCE_KEYS.HIDE_SUPPORT_MESSAGING_COOKIE, 'false');
			expect(shouldNotBeShownSupportMessaging()).toBe(false);
		});

		it('Returns false when the user has no hide support messaging cookie', () => {
			removeCookie(PERSISTENCE_KEYS.HIDE_SUPPORT_MESSAGING_COOKIE);
			expect(shouldNotBeShownSupportMessaging()).toBe(false);
		});
	});
});

const setSupportFrontendOneOffContributionCookie = (value: string) =>
	addCookie(PERSISTENCE_KEYS.SUPPORT_ONE_OFF_CONTRIBUTION_COOKIE, value);

const removeSupportFrontendOneOffContributionCookie = () =>
	removeCookie(PERSISTENCE_KEYS.SUPPORT_ONE_OFF_CONTRIBUTION_COOKIE);

const setAttributesOneOffContributionCookie = (value: string) =>
	addCookie(PERSISTENCE_KEYS.ONE_OFF_CONTRIBUTION_DATE_COOKIE, value);

const removeAttributesOneOffContributionCookie = () =>
	removeCookie(PERSISTENCE_KEYS.ONE_OFF_CONTRIBUTION_DATE_COOKIE);

describe('getting the last one-off contribution date of a user', () => {
	beforeEach(() => {
		removeSupportFrontendOneOffContributionCookie();
		removeAttributesOneOffContributionCookie();
	});

	const contributionDate = '2018-01-06';
	const contributionDateTimeEpoch = Date.parse(contributionDate);

	it("returns null if the user hasn't previously contributed", () => {
		expect(getLastOneOffContributionTimestamp()).toBe(null);
	});

	it('return the correct date if the user support-frontend contribution cookie is set', () => {
		setSupportFrontendOneOffContributionCookie(
			contributionDateTimeEpoch.toString(),
		);
		expect(getLastOneOffContributionTimestamp()).toBe(
			contributionDateTimeEpoch,
		);
	});

	it('returns null if the cookie has been set with an invalid value', () => {
		setSupportFrontendOneOffContributionCookie('invalid value');
		expect(getLastOneOffContributionTimestamp()).toBe(null);
	});

	it('returns the correct date if cookie from attributes is set', () => {
		setAttributesOneOffContributionCookie(contributionDate.toString());
		expect(getLastOneOffContributionTimestamp()).toBe(
			contributionDateTimeEpoch,
		);
	});
});

describe('getting the days since last contribution', () => {
	beforeEach(() => {
		removeSupportFrontendOneOffContributionCookie();
		removeAttributesOneOffContributionCookie();
	});

	const contributionDateTimeEpoch = String(
		Date.parse('2018-08-01T12:00:30Z'),
	);

	it('returns null if the last one-off contribution date is null', () => {
		expect(getDaysSinceLastOneOffContribution()).toBe(null);
	});

	it('returns the difference in days between the last contribution date and now if the last contribution date is set', () => {
		global.Date.now = jest.fn(() => Date.parse('2018-08-07T10:50:34'));
		setSupportFrontendOneOffContributionCookie(contributionDateTimeEpoch);
		expect(getDaysSinceLastOneOffContribution()).toBe(5);
	});
});

describe('isRecentOneOffContributor', () => {
	beforeEach(() => {
		removeSupportFrontendOneOffContributionCookie();
		removeAttributesOneOffContributionCookie();
	});

	const contributionDateTimeEpoch = String(
		Date.parse('2018-08-01T12:00:30Z'),
	);

	it('returns false if there is no one-off contribution cookie', () => {
		expect(isRecentOneOffContributor()).toBe(false);
	});

	it('returns true if there are 5 days between the last contribution date and now', () => {
		global.Date.now = jest.fn(() => Date.parse('2018-08-07T10:50:34'));
		setSupportFrontendOneOffContributionCookie(contributionDateTimeEpoch);
		expect(isRecentOneOffContributor()).toBe(true);
	});

	it('returns true if there are 0 days between the last contribution date and now', () => {
		global.Date.now = jest.fn(() => Date.parse('2018-08-01T13:00:30'));
		setSupportFrontendOneOffContributionCookie(contributionDateTimeEpoch);
		expect(isRecentOneOffContributor()).toBe(true);
	});

	it('returns false if the one-off contribution was more than 3 months ago', () => {
		global.Date.now = jest.fn(() => Date.parse('2019-08-01T13:00:30'));
		setSupportFrontendOneOffContributionCookie(contributionDateTimeEpoch);
		expect(isRecentOneOffContributor()).toBe(false);
	});
});
