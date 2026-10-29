export const installOnDvtagReady = (): void => {
	/* eslint-disable -- dv code */
	window.onDvtagReady = function (callback?: () => void, timeout = 750) {
		window.dvtag = window.dvtag || {};
		// @ts-expect-error
		dvtag.cmd = dvtag.cmd || [];
		const opt = { callback, timeout, timestamp: new Date().getTime() };
		// @ts-expect-error
		dvtag.cmd.push(function () {
			dvtag.queueAdRequest(opt);
		});
		setTimeout(function () {
			const cb = opt.callback;
			// @ts-expect-error
			opt.callback = null;
			if (cb) cb();
		}, timeout);
	};
	/* eslint-enable */
};
