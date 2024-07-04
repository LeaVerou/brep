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