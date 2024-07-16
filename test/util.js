import { resolvePath } from "../src/util-node.js";

export default {
	name: "Utility functions",
	tests: [
		{
			name: "resolvePath()",
			run (from, to) {
				let path = resolvePath(from, to);
				return to.startsWith("/") ? path : path.replace(process.cwd() + "/", "");
			},
			getName (from, to) {
				return to;
			},
			tests: [
				{
					args: ["papers/foo/bar.tex", "."],
					expect: "papers/foo/bar.tex",
				},
				{
					args: ["papers/foo/bar.tex", ".."],
					expect: "papers/bar.tex",
				},
				{
					args: ["papers/foo/bar.tex", "../../src"],
					expect: "src/bar.tex",
				},
				{
					args: ["papers/foo/bar.tex", "baz/yolo"],
					expect: "papers/foo/baz/yolo/bar.tex",
				},
				{
					args: ["papers/foo/bar.tex", "/baz"],
					expect: "/baz/bar.tex",
				},
			],
		},
	],
}
