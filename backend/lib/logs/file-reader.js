import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { createInterface } from "node:readline";

export async function fileExists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

export async function readLines(filePath) {
	if (!(await fileExists(filePath))) return [];
	return new Promise((resolve) => {
		const lines = [];
		const rl = createInterface({
			input: createReadStream(filePath, { encoding: "utf-8" }),
			crlfDelay: Infinity,
		});
		rl.on("line", (line) => {
			if (line.trim()) lines.push(line);
		});
		rl.on("close", () => resolve(lines));
		rl.on("error", () => resolve([]));
	});
}

// nginx-style rotation: base + base.1 .. base.N
export function rotatedFiles(base, rotations, separator = ".") {
	const files = [base];
	for (let i = 1; i <= rotations; i++) {
		files.push(`${base}${separator}${i}`);
	}
	return files;
}
