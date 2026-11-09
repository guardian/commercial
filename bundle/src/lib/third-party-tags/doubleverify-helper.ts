export const installOnDvtagReady = (): void => {
	window.onDvtagReady = function (callback?: () => void, timeout = 750) {
		window.dvtag = window.dvtag ?? {};
		window.dvtag.cmd = window.dvtag.cmd ?? [];
		const opt = {
			callback: callback ?? null,
			timeout,
			timestamp: new Date().getTime(),
		};
		window.dvtag.cmd.push(function () {
			window.dvtag?.queueAdRequest?.(opt);
		});
		setTimeout(function () {
			const cb = opt.callback;
			opt.callback = null;
			if (cb) cb();
		}, timeout);
	};
};
