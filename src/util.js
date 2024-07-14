import path from "path";

export function applyDefaults (options, defaults) {
	return Object.assign({}, defaults, options);
}

/**
 * Generic function to parse Node.js CLI args
 * @param {*} argv
 * @param {*} defaults
 * @returns {object}
 */
export function parseArgs (argv = process.argv) {
	argv = argv.slice(2);
	let ret = {positional: []};
	let openFlag = false;

	for (let arg of argv) {
		if (arg.startsWith("--")) {
			// Lengthy flag, e.g. --dry-run
			let [key, ...value] = arg.slice(2).split("=");
			value = value.join("="); // value may contain =, so we need to rejoin it
			key = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
			ret[key] = value || true;
		}
		else if (/^\-[a-z]$/.test(arg)) {
			// Single letter flag, e.g. -D or -o
			openFlag = arg.slice(1);
		}
		else {
			if (openFlag) {
				ret[openFlag] = arg;
				openFlag = false;
			}
			else {
				ret.positional.push(arg);
			}
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

/**
 * Resolves a target path relative to a base path.
 * @param {string} from - The base path.
 * @param {string} to - The target path to resolve to.
 * @returns {string} The resolved path.
 */
export function resolvePath (from, to) {
	let fromParsed = path.parse(from);
	return path.resolve(fromParsed.dir, to, fromParsed.base);
}