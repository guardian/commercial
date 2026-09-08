module.exports = {
	presets: ['@babel/preset-react', '@babel/preset-env'],
	plugins: ['@babel/plugin-syntax-dynamic-import'],
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
			plugins: ['@babel/plugin-transform-runtime'],
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
			plugins: ['@babel/plugin-transform-runtime', 'dynamic-import-node'],
		},
	},
	ignore: ['eslintrc.js'],
};
