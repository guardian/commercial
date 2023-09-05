const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

/**
 * Retrieve the number of TS errors when running tsc
 */
const runTSC = () => {
	try {
		const output = execSync(
			'yarn tsc --pretty --project ./tsconfig.gamify.json',
		);
		// If it succeeds we don't have any errors!
		return null;
	} catch (err) {
		/** @type {string} */
		const stdOut = err.stdout.toString();
		const errorRegex = /Found\s+(\w+).*/g;
		const errorCount = Number(stdOut.match(errorRegex)[0].split(' ')[1]);
		return errorCount;
	}
};

const retrieveStoredErrorCount = () => {
	const errorCount = readFileSync('.num-errors').toString();
	return Number(errorCount);
};

const updateStoredErrorCount = (errorCount) => {
	writeFileSync('.num-errors', String(errorCount), {
		encoding: 'utf8',
		flag: 'w',
	});
};

const verifyStoredErrorCount = (errorCount) => {
	const storedErrorCount = retrieveStoredErrorCount();
	if (errorCount === storedErrorCount) {
		// TODO Post encouraging github comment
		console.log(
			'well done you remembered to check the thing in. and you got the count down!',
		);
		process.exit(0);
	} else {
		// TODO Post ERROR to update the stored count and check it in!
		console.error('did you forget to check in the newly updated count?');
		process.exit(1);
	}
};

const check = () => {
	const NUM_ERRORS_MAIN = process.env.NUM_ERRORS_MAIN;
	const errorCount = runTSC();

	console.log({ NUM_ERRORS_MAIN, errorCount });

	if (errorCount === NUM_ERRORS_MAIN) {
		console.log('TS error count is the same. This is fine');
		return;
	} else if (errorCount < NUM_ERRORS_MAIN) {
		verifyStoredErrorCount(errorCount);
	} else {
		process.exit(1);
	}
};

const update = () => {
	const errorCount = runTSC();
	updateStoredErrorCount(errorCount);
	console.log(`.num-errors successfully updated to ${errorCount}`);
};

const main = () => {
	// e.g. `node ./scripts/no-unchecked.js --check`
	const flag = process.argv[2];
	switch (flag) {
		case '--check': {
			check();
		}
		case '--update': {
			update();
		}
		default: {
			console.error('Two supported flags are --check and --update');
			process.exit(1);
		}
	}
};

main();
