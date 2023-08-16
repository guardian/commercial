module.exports = {
	presets: ['@babel/preset-react'],
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
		internal: {
			presets: [['@babel/preset-env']],
		},
	},
	ignore: ['eslintrc.js'],
};
