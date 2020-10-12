#!/usr/bin/env node

const { lint, read, load } = require('@commitlint/core');
const chalk = require('chalk');

(async () => {
	const [[message], { rules }] = await Promise.all([
		read({ edit: process.env.HUSKY_GIT_PARAMS }),
		load(),
	]);

	const { valid } = await lint(message, rules);

	if (!valid) {
		console.error(
			[
				'',
				chalk.red('✖ Invalid commit message'.toUpperCase()),
				`Messages should conform to the Conventional Commit format.`,
				chalk.dim('https://www.conventionalcommits.org/en/v1.0.0/#summary'),
				'',
				chalk.cyan('Try using `yarn commit` instead.'),
				'',
			].join('\n'),
		);
		process.exit(1);
	}
})();
