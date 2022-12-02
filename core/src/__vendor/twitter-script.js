// Twitter universal website tag code
// How to set up conversion tracking: https://business.twitter.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html

export const twitterScript = () => {
	!(function (e, t, n, s, u, a) {
		e.twq ||
			((s = e.twq = function () {
				s.exe ? s.exe(...arguments) : s.queue.push(arguments);
			}),
			(s.version = '1.1'),
			(s.queue = []),
			(u = t.createElement(n)),
			(u.async = !0),
			(u.src = '//static.ads-twitter.com/uwt.js'),
			(a = t.getElementsByTagName(n)[0]),
			a.parentNode.insertBefore(u, a));
	})(window, document, 'script');
	// Insert Twitter Pixel ID and Standard Event data below
	twq('init', 'nyl43'); // The Guardian ID
	twq('track', 'PageView');

	twq('init', 'ny4k9'); // PHD ID
	twq('track', 'PageView');
};
