const SECURE_CONTACT_PAGES = [
	'help/ng-interactive/2017/mar/17/contact-the-guardian-securely',
	'help/2016/sep/19/how-to-contact-the-guardian-securely',
];

const isSecureContactPage = (): boolean =>
	SECURE_CONTACT_PAGES.includes(window.guardian.config.page.pageId);

export { isSecureContactPage };
