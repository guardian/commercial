/**
 * Admiral AdBlock Recovery
 * Client-side implementation method
 */
export const admiralScript = () => {
	!(function (o, _name) {
		((o[_name] =
			o[_name] ||
			function $() {
				($.q = $.q || []).push(arguments);
			}),
			(o[_name].v = o[_name].v || 2),
			(o[_name].s = '1'));
		!(function (o, t, e, n, c, a, f) {
			function i(n, c) {
				(n = (function (t, e) {
					try {
						if (
							(e = (t = o.localStorage).getItem(
								'_aQS01QTg3MzRCMjVGRDY4RTI1OTAzNkJFMzYtMQ',
							))
						)
							return JSON.parse(e).lgk || [];
						if (
							(f = t.getItem(
								decodeURI(
									decodeURI(
										'%257%36%34%25%36%31%25%36%331%65%69%5a%25%37%32%253%30',
									),
								),
							)) &&
							f.split(',')[4] > 0
						)
							return [[_name + '-engaged', 'true']];
					} catch (n) {}
				})()) &&
					typeof n.forEach === e &&
					(c = o[t].pubads()) &&
					n.forEach(function (o) {
						o && o[0] && c.setTargeting(o[0], o[1] || '');
					});
			}
			try {
				(((a = o[t] = o[t] || {}).cmd = a.cmd || []),
					typeof a.pubads === e
						? i()
						: typeof a.cmd.unshift === e
							? a.cmd.unshift(i)
							: a.cmd.push(i));
			} catch (r) {}
		})(window, 'googletag', 'function');
	})(
		window,
		decodeURI(
			decodeURI('%61%25%36%34%25%36%64%25%36%39%25%37%32a%25%36%63'),
		),
	);
	!(function (t, c, o, $) {
		((o = t.createElement(c)),
			(t = t.getElementsByTagName(c)[0]),
			(o.async = 1),
			(o.src =
				'https://recipepin.com/fa1218cb7bd96/bed70985991fb99152abd2c672649d4ab.bundle.js'),
			($ = 0) && $(o),
			t.parentNode.insertBefore(o, t));
	})(document, 'script');
};
