import webpack from 'webpack';
import prodConfig from './webpack.config.prod.mjs';
import { updateParameterStore } from './webpack/updateParameterStore.mjs'
import { prout } from './webpack/prout.mjs'

webpack(prodConfig, (err, stats) => {
	if (err) {
		console.error('Webpack build failed:', err);
		process.exit(1);
	}

	if (stats.hasErrors()) {
		console.error('Webpack compilation error:\n', stats.toString({ colors: true }));
		process.exit(1);
	}

	/**
	 * Each child compilation in the compilation stats represents a
	 * config in a multi-compiler/config setup. We can access data
	 * on assets emitted in that child compilation using this.
	**/
	const { children } = stats.toJson({ entrypoints: true });

	if (!children) {
		console.error('Webpack compilation error, no child compilations:\n', stats.toString({ colors: true }));
		process.exit(1);
	}

	/**
	 * outputPath is used when saving the cloudformation.json, it
	 * goes in the same directory as the generated artificats.
	 * As we use the same outputPath for all artificats we can
	 * pull this from the first child.
	**/
	const { outputPath } = children[0];

	updateParameterStore(children, outputPath);
	prout(outputPath);
});
