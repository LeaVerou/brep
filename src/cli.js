#!/usr/bin/env node

import Bafr from "./bafr.js";
import * as util from "./util.js";

let args = util.parseArgs(process.argv, {
	verbose: false,
	dryRun: false,
});

let bafr = Bafr.fromPath(args.script, args);

let {paths, done, changed, intact} = await bafr.glob();

await done;

console.info(`Processed ${ paths.length } files. ${ changed.size } files were changed and ${ intact.size } files remained intact.`);
