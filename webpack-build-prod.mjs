// build.js
import webpack from 'webpack';
import config from './webpack.config.prod.mjs';
import { UpdateParameterStorePlugin } from './webpack/update-parameter-store-plugin.mjs';

webpack(config, (err, stats) => {
	if (err) {
		console.error('Webpack build failed:', err);
		process.exit(1);
	}

	if (stats.hasErrors()) {
		console.error('Webpack compilation errors:\n', stats.toString({ colors: true }));
		process.exit(1);
	}

	// const { compilation } = stats;
	// const entry = compilation.entrypoints.get('commercial-standalone');
	// const hashedFilePath = entry?.getFiles()[0];

	const data = stats.toJson({ all: false, assets: true, entrypoints: true });

	console.log('********** Webpack build completed successfully. ********', data.children[1].entrypoints['commercial-standalone']);
});
