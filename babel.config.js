module.exports = {
	presets: ['@babel/preset-react', '@babel/preset-env'],
	plugins: [
		'@babel/plugin-proposal-object-rest-spread',
		'@babel/plugin-syntax-dynamic-import',
	],
	env: {
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
				'@babel/plugin-proposal-class-properties',
				'dynamic-import-node',
			],
		},
	},
	ignore: ['eslintrc.js'],
};
