import { articles } from '../fixtures/pages';
import { storage } from '@guardian/libs';

// ***********************************************
// For comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('getIframeBody', (selector: string) => {
	// get the iframe > document > body
	// and retry until the body element is not empty
	return (
		cy
			.get(
				selector.startsWith('iframe')
					? selector
					: `iframe[id^="${selector}"`,
			)
			.its('0.contentDocument.body')
			.should('not.be.empty')
			// wraps "body" DOM element to allow
			// chaining more Cypress commands, like ".find(...)"
			// https://on.cypress.io/wrap
			.then<Element>(cy.wrap)
	);
});

Cypress.Commands.add('findAdSlotIframeBySlotId', (adSlotId: string) => {
	cy.get(`#${adSlotId}`).find('iframe', { timeout: 30000 });
});

/**
 * Sourcepoint have ensured us that the following class names
 * will not change so they are the safest way to select the
 * manage, reject all and accept buttons
 */
const MANAGE_MY_COOKIES_BUTTON = 'button.sp_choice_type_12';
const REJECT_ALL_BUTTON = 'button.sp_choice_type_REJECT_ALL';
const ACCEPT_BUTTON = 'button.sp_choice_type_11';

Cypress.Commands.add('rejectAllConsent', () => {
	cy.getIframeBody('sp_message_iframe_')
		.find(MANAGE_MY_COOKIES_BUTTON)
		.click();

	cy.getIframeBody('iframe[title="SP Consent Message"]')
		.find(REJECT_ALL_BUTTON, { timeout: 30000 })
		.click();
	cy.wait(100);
});

Cypress.Commands.add('allowAllConsent', () => {
	cy.getIframeBody('sp_message_iframe_')
		.find(ACCEPT_BUTTON, { timeout: 30000 })
		.click();
	cy.wait(100);
});

Cypress.Commands.add('hydrate', () => {
	// force all islands to trigger in case Cypress cannot find the scroll position
	cy.scrollTo('bottom', { duration: 1000 });
	cy.scrollTo('top', { duration: 1000 });
	// individually wait for all islands to hydrate
	return cy
		.get('gu-island')
		.each((el) => {
			const deferuntil = el.attr('deferuntil');
			const name = el.attr('name');
			const defer = el.attr('deferuntil');
			const islandMeta = `island: ${name} defer: ${defer}`;
			if (['idle', 'visible', undefined].includes(deferuntil)) {
				cy.log(`Scrolling to ${islandMeta}`);
				cy.wrap(el)
					.scrollIntoView({ duration: 1000, timeout: 30000 })
					.should('have.attr', 'data-gu-ready', 'true', {
						timeout: 30000,
					});
				// Additional wait to ensure island defer=visible has triggered
				// eslint-disable-next-line cypress/no-unnecessary-waiting
				cy.wait(1000);
			} else {
				cy.log(`Skipping ${islandMeta}`);
			}
		})
		.then(() => {
			cy.scrollTo('top');
			// Additional wait to ensure layout shift has completed post hydration
			// eslint-disable-next-line cypress/no-unnecessary-waiting
			cy.wait(10000);
		});
});

Cypress.Commands.add('checkAdsRendered', () => {
	return cy
		.get('.ad-slot')
		.each((el) => {
			cy.log(`Scrolling to ad: ${el.attr('id')}`);
			cy.wrap(el)
				.scrollIntoView({ duration: 1000, timeout: 30000 })
				.should('have.class', 'ad-slot--rendered', {
					timeout: 30000,
				});
			// Additional wait to ensure visbility has triggered
			// eslint-disable-next-line cypress/no-unnecessary-waiting
			cy.wait(2000);
		})
		.then(() => {
			cy.scrollTo('top');
			// Additional wait to ensure layout shift has completed post hydration
			// eslint-disable-next-line cypress/no-unnecessary-waiting
			cy.wait(10000);
		});
});

Cypress.Commands.add('useConsentedSession', (name: string) => {
	cy.session(name, () => {
		storage.local.set('gu.geo.override', 'GB');

		cy.intercept('**/gpt.js').as('consentAll');

		cy.visit(articles[0].path);
		localStorage.setItem(
			'gu.prefs.engagementBannerLastClosedAt',
			`{"value":"${new Date().toISOString()}"}`,
		);
		cy.allowAllConsent();
		cy.wait('@consentAll', { timeout: 30000 });
	});
});
