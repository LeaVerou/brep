#!/usr/bin/env node

import Bafr from "./bafr.js";
import * as util from "./util.js";

let args = util.parseArgs(process.argv, {
	verbose: false,
	dryRun: false,
});

let bafr = Bafr.fromPath(args.script, args);

let {done, ...outcome} = await bafr.glob();

await done;

let message = util.serializeOutcome(outcome);

console.info(message);
