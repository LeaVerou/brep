export function parseArgs (argv = process.argv, defaults = {}) {
	argv = argv.slice(2);
	let script = argv.shift();

	let ret = Object.assign({script}, defaults); // no default for script so no risk of overwriting

	if (!ret.script) {
		throw new Error("Please provide a path to a script file as the first argument.");
	}

	for (let arg of argv) {
		if (arg.startsWith("--")) {
			// Flag
			let [key, ...value] = arg.slice(2).split("=");
			value = value.join("="); // value may contain =, so we need to rejoin it
			key = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
			ret[key] = value || true;
		}
		else if (!ret.files) {
			ret.files = arg;
		}
	}

	return ret;
}

export function serializeOutcome ({paths, changed, intact, timeTaken}) {
	let one = paths.length === 1;
	let files = `${ paths.length } file${ one ? "" : "s" }`;
	let changedFiles = `${ intact.size === 0 ? (one ? "it" : "all of them ") : (changed.size || "none") }`

	return `Processed ${ files } and changed ${ changedFiles } in ${ formatTimeTaken(timeTaken) }.`
}

export function formatTimeTaken (ms) {
	let n = ms, unit = "ms";
	if (ms >= 1000) {
		n /= 1000;
		unit = "s";
	}
	if (n >= 60) {
		n /= 60;
		unit = "min";
	}

	return `${ n.toPrecision(3) } ${ unit }`;
}