import Bafr from "./bafr.js";
import * as util from "./util.js";

export default async function cli (script, options) {
	let start = performance.now();

	if (arguments.length === 1) {
		// CLI process.argv
		if (Array.isArray(script)) {
			options = util.parseArgs(script);

			let files;
			[script, ...files] = options.positional;
			if (files.length > 0) {
				options.files ??= files;
			}
		}
	}

	if (!script) {
		throw new Error("Please provide a path to a script file as the first argument.");
	}

	let bafr = Bafr.fromPath(script, options);

	let outcome = await bafr.glob();
	outcome.timeTaken = await outcome.timeTaken;

	let message = util.serializeOutcome(outcome);
	outcome.totalTimeTaken = performance.now() - start;

	if (!bafr.options.quiet) {
		console.info(message, `(total time: ${ util.formatTimeTaken(outcome.totalTimeTaken) })`);
	}

	return outcome;
}
