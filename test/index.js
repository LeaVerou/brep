import compile from "./compile.js";
import replace from "./replace.js";

export default {
	name: "All tests",
	tests: [
		compile,
		replace,
	]
}