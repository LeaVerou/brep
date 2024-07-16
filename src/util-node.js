import path from "path";

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
