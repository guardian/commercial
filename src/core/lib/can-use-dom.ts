// Based on https://github.com/JedWatson/exenv

const canUseDom = (): boolean =>
	!!(
		typeof window !== 'undefined' &&
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ensure we check at runtime
		window.document &&
		window.document.createElement
	);

export { canUseDom };
