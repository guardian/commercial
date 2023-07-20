/// <reference types="cypress" />
import { articles } from '../../fixtures/pages';
import { fakeLogOut, fakeLogin } from '../../lib/util';

// Don't fail tests when uncaught exceptions occur
// This is because scripts loaded on the page and unrelated to these tests can cause this
Cypress.on('uncaught:exception', () => {
	return false;
});

const adsShouldShow = () => {
	cy.get('#dfp-ad--top-above-nav').should('exist');

	// Check that an iframe is placed inside the ad slot
	cy.findAdSlotIframeBySlotId('dfp-ad--top-above-nav').should('exist');
};

const adsShouldNotShow = () => {
	cy.get(`[data-name="top-above-nav"]`).should('not.exist');
};

const reconsent = () => {
	cy.get('[data-link-name="privacy-settings"]')
		.scrollIntoView({
			duration: 500,
		})
		.click();

	cy.getIframeBody('iframe[title="SP Consent Message"]')
		.find(`button[title="Accept all"]`)
		.click();

	// waits are bad but how to wait for consent change?
	cy.wait(100);

	// scrollintoview not working for some reason
	cy.scrollTo('top');
	cy.wait(100);
};

describe('tcfv2 consent', () => {
	beforeEach(() => {
		cy.clearCookies();
		cy.clearLocalStorage().then(() => {
			cy.log('override geolocation');
			window.localStorage.setItem(
				'gu.geo.override',
				JSON.stringify({ value: 'GB' }),
			);
		});

		Cypress.on('window:before:load', (win) => {
			cy.spy(win.localStorage, 'setItem').log(false);
		});
	});

	const { path } = articles[0];

	it(`Test ${path} hides targeted slots when consent is denied`, () => {
		cy.visit(path);

		cy.rejectAllConsent();

		cy.get(`[data-name="top-above-nav"]`).should('not.exist');

		// Check the header still shows support message
		cy.get('[name="SupportTheG"]')
			.should('have.attr', 'data-gu-ready', 'true', {
				timeout: 30000,
			})
			.find('h2')
			.should('contain', 'Support the Guardian');
	});

	it.skip(`Test ${path} shows ad slots when reconsented`, () => {
		cy.visit(path);

		cy.rejectAllConsent();

		// prevent support banner so we can click privacy settings button
		localStorage.setItem(
			'gu.prefs.engagementBannerLastClosedAt',
			`{"value":"${new Date().toISOString()}"}`,
		);

		cy.reload();

		reconsent();

		cy.reload();

		adsShouldShow();
	});

	it.skip(`Test ${path} reject all, login as subscriber, log out should show ads`, () => {
		let { path } = articles[4];

		fakeLogin(true);

		cy.visit(path);

		cy.rejectAllConsent();

		cy.reload();

		fakeLogOut();

		cy.reload();

		adsShouldShow();
	});

	it(`Test ${path} reject all, login as subscriber, should not show ads`, () => {
		fakeLogin(true);

		cy.visit(path);

		cy.rejectAllConsent();

		cy.reload();

		adsShouldNotShow();
	});

	it.skip(`Test ${path} reject all, login as non-subscriber should show ads, log out should show ads`, () => {
		let { path } = articles[4];

		fakeLogin(false);

		cy.visit(path);

		cy.rejectAllConsent();

		adsShouldShow();

		fakeLogOut();

		adsShouldShow();
	});

	it.skip(`Test ${path} reject all, login as non-subscriber, reconsent should show ads`, () => {
		cy.visit(path);

		cy.rejectAllConsent();

		fakeLogin(false);

		// prevent support banner so we can click privacy settings button
		localStorage.setItem(
			'gu.prefs.engagementBannerLastClosedAt',
			`{"value":"${new Date().toISOString()}"}`,
		);

		cy.reload();

		adsShouldShow();

		reconsent();

		cy.reload();

		adsShouldShow();
	});

	it(`Test ${path} accept all, login as subscriber, subscription expires, should show ads`, () => {
		fakeLogin(true);

		cy.visit(path);

		cy.allowAllConsent();

		cy.reload();

		cy.setCookie(
			'gu_user_features_expiry',
			String(new Date().getTime() - 1000),
		);

		// to intercept response
		fakeLogin(false);

		cy.reload();

		cy.reload();

		adsShouldShow();
	});

	it.skip(`Test ${path} reject all, login as subscriber, subscription expires, should show ads`, () => {
		let { path } = articles[4];

		fakeLogin(true);

		cy.visit(path);

		cy.rejectAllConsent();

		cy.setCookie(
			'gu_user_features_expiry',
			String(new Date().getTime() - 1000),
		);

		// to intercept response
		fakeLogin(false);

		cy.reload();

		// reload twice so server is not sent ad free cookie
		cy.reload();

		adsShouldShow();
	});

	it(`Test ${path} allow all, logged in, don't show ads`, () => {
		fakeLogin(true);

		cy.visit(path);

		cy.allowAllConsent();

		cy.wait('@userData');

		cy.reload();

		cy.get('#dfp-ad--top-above-nav').should('not.exist');
	});
});
