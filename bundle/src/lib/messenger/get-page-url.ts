import type { RegisterListener } from '../messenger';

const initGetPageUrlMessage = (register: RegisterListener): void => {
	register(
		'get-page-url',
		() => window.location.origin + window.location.pathname,
	);
};

export { initGetPageUrlMessage };
