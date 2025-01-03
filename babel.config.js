module.exports = {
	presets: ['@babel/preset-env'],
	plugins: [
		'@babel/plugin-syntax-dynamic-import',
	],
	compact: false,
	env: {
		production: {
			presets: [
				[
					'@babel/preset-env',
					{
						modules: false,
					},
				],
			],
			plugins: [
				'@babel/plugin-transform-runtime',
			],
		},
		test: {
			presets: [
				[
					'@babel/preset-env',
					{
						targets: {
							node: 'current',
						},
					},
				],
			],
			plugins: [
				'@babel/plugin-transform-runtime',
				'dynamic-import-node',
			],
		},
	},
	ignore: ['eslintrc.js'],
};
