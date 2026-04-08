const SECURE_CONTACT_PAGES = [
	'help/ng-interactive/2017/mar/17/contact-the-guardian-securely',
	'help/2016/sep/19/how-to-contact-the-guardian-securely',
];

const isSecureContactPage = (pageId: string): boolean =>
	SECURE_CONTACT_PAGES.includes(pageId);

export { isSecureContactPage };
