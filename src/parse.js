import * as toml from "smol-toml";
import yaml from "yaml";

let formats = {
	toml,
	yaml,
	"yml": yaml,
	json: JSON,
};

export const parsers = {toml, yaml, JSON};

export default function parse (script, format = "toml") {
	let parser = formats[format] ?? toml;

	try {
		script = parser.parse(script);
	}
	catch (e) {
		throw new Error(`Failed to parse script file as ${format}. Original error was:`, e);
	}

	return script;
}