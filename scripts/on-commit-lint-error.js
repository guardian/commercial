const chalk = require('chalk');

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
