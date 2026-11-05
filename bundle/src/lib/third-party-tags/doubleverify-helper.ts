export const installOnDvtagReady = (): void => {
	/* eslint-disable -- dv code */
	window.onDvtagReady = function (callback?: () => void, timeout = 750) {
		window.dvtag = window.dvtag || {};
		window.dvtag.cmd = window.dvtag.cmd || [];
		const opt = { callback, timeout, timestamp: new Date().getTime() };
		window.dvtag.cmd.push(function () {
			// @ts-expect-error -- DV snippet uses bare dvtag global
			window.dvtag.queueAdRequest(opt);
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
