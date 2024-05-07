import puppeteer from 'puppeteer';

const SP_LAYER1_ACCEPT_ALL_BUTTON = 'button.sp_choice_type_11';

const articles = [
	'https://www.theguardian.com/sport/2024/mar/25/jasmin-paris-interview-barkley-marathons-ultramarathon-history',
	'https://www.theguardian.com/food/2023/oct/04/how-to-make-the-perfect-marmite-spaghetti-recipe-felicity-cloake-comfort-food',
	'https://www.theguardian.com/travel/2024/apr/12/readers-favourite-trips-to-scandinavia-sweden-norway-denmark',
	'https://www.theguardian.com/books/2022/jul/18/tomorrow-and-tomorrow-and-tomorrow-by-gabrielle-zevin-review-when-game-boy-meets-game-girl',
	'https://www.theguardian.com/commentisfree/2022/oct/27/we-can-go-to-the-moon-so-why-cant-we-stop-my-glasses-sliding-down-my-nose',
	'https://www.theguardian.com/culture/2018/jan/25/the-20-greatest-oscar-snubs-ever-ranked',
	'https://www.theguardian.com/lifeandstyle/2023/sep/29/21-things-ive-learned-about-skin-care-sali-hughes',
	'https://www.theguardian.com/lifeandstyle/2024/apr/21/favourite-flowers-and-moles-making-merry',
	'https://www.theguardian.com/science/2024/feb/23/quantum-physics-microscopic-gravity-discovery',
	'https://www.theguardian.com/science/2024/mar/31/can-you-solve-it-best-pub-quiz-questions-ever',
	'https://www.theguardian.com/commentisfree/2024/may/01/vote-for-my-friend-sadiq-khan-dont-let-toxic-incompetent-tory-rule-ruin-london',
	'https://www.theguardian.com/books/2024/may/01/what-were-reading-writers-and-readers-on-the-books-they-enjoyed-in-april',
	'https://www.theguardian.com/travel/2024/may/01/its-not-the-zambezi-but-the-tweed-has-its-moments-canoeing-in-the-scottish-borders',
	'https://www.theguardian.com/sport/2024/apr/13/emma-raducanu-leads-gb-to-bjk-cup-finals-with-stunning-win-over-france',
	'https://www.theguardian.com/commentisfree/2024/apr/30/rishi-sunak-lead-tories-local-elections-regicide-as-usual',
	'https://www.theguardian.com/australia-news/2024/may/01/after-25-years-logging-and-bushfires-a-greater-glider-has-been-spotted-in-deongwar-state-forest',
	'https://www.theguardian.com/business/2024/apr/29/ireland-reaps-700m-brexit-bonanza-from-customs-duties',
	'https://www.theguardian.com/games/2020/mar/16/animal-crossing-new-horizons-review-nintendo-switch',
	'https://www.theguardian.com/money/2024/apr/29/meal-prepping-is-booming-but-beware-the-health-dangers',
	'https://www.theguardian.com/technology/2024/apr/30/amazon-sales-report-ai',
];

void puppeteer.launch().then(async (browser) => {
	const testStartTime = Date.now();

	const page = await browser.newPage();

	// Connect to Chrome DevTools
	const client = await page.target().createCDPSession();

	// Set throttling property
	// * 1024/8 converts from kilobits to bytes per second
	await client.send('Network.emulateNetworkConditions', {
		offline: false,
		downloadThroughput: 4000 * (1024 / 8),
		uploadThroughput: 2000 * (1024 / 8),
		latency: 150,
	});

	await page.setViewport({ width: 1400, height: 800 });
	await page.goto(
		'http://localhost:3030/Front/https://www.theguardian.com/uk',
	);

	await new Promise((r) => setTimeout(r, 2000));

	// Find the sourcepoint consent banner
	const frame = page
		.frames()
		.find((frame) => frame.url().includes('https://cdn.privacy-mgmt.com'));

	await new Promise((r) => setTimeout(r, 2000));
	// Accept all
	await frame?.click(SP_LAYER1_ACCEPT_ALL_BUTTON);

	// These timeouts reduce the error rate in the tests
	await new Promise((r) => setTimeout(r, 2000));

	// Use total ad rendering time to average out results from multiple page loads
	let totalAdRenderingTime = 0;

	for (const article of articles) {
		const startRenderingTime = Date.now();

		await page.goto(`http://localhost:3030/Article/${article}`, {
			waitUntil: 'domcontentloaded',
			timeout: 0,
		});

		await page.waitForSelector('#dfp-ad--top-above-nav iframe', {
			visible: true,
		});

		const endRenderingTime = Date.now();

		console.log(
			`Ad rendered in ${endRenderingTime - startRenderingTime} ms`,
		);

		totalAdRenderingTime += endRenderingTime - startRenderingTime;

		await new Promise((r) => setTimeout(r, 2000));
	}

	const testEndTime = Date.now();

	await browser.close();

	console.log(`Average ad render time is ${totalAdRenderingTime / 20} ms`);
	console.log(`Test completed in ${(testEndTime - testStartTime) / 1000} s`);
});
