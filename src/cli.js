#!/usr/bin/env node

import Bafr from "./bafr.js";
import * as util from "./util.js";

let start = performance.now();

let args = util.parseArgs(process.argv, {
	verbose: false,
	dryRun: false,
});

let bafr = Bafr.fromPath(args.script, args);

let outcome = await bafr.glob();
outcome.timeTaken = await outcome.timeTaken;

let message = util.serializeOutcome(outcome);
let totalTimeTaken = performance.now() - start;

console.info(message, `(total time: ${ util.formatTimeTaken(totalTimeTaken) })`);
