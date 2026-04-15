import { readLines, rotatedFiles } from "../file-reader.js";
import { NGINX_ERROR_LOG, NGINX_LOG_ROTATIONS } from "../paths.js";

const ERROR_LOG_REGEX =
	/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] (\d+#\d+): (?:\*(\d+) )?(.+)/;
const CLIENT_REGEX = /client: ([\d.a-fA-F:]+)/;
const SERVER_REGEX = /server: ([^,]+?)(?:,|$)/;
const REQUEST_REGEX = /request: "([A-Z]+) (.+?) (HTTP\/[\d.]+)"/;
const HOST_REGEX = /host: "([^"]+)"/;
const REFERRER_REGEX = /referrer: "([^"]+)"/;
const UPSTREAM_REGEX = /upstream: "([^"]+)"/;
const FIELD_STRIPS = [
	/,\s*client: [\d.a-fA-F:]+/,
	/,\s*server: [^,]+/,
	/,\s*request: "[^"]*"/,
	/,\s*host: "[^"]*"/,
	/,\s*referrer: "[^"]*"/,
	/,\s*upstream: "[^"]*"/,
];
const MAX_LINES = 100_000;

export function parseErrorLog(line) {
	const match = line.match(ERROR_LOG_REGEX);
	if (!match) return null;
	const [, timeRaw, level, pid, connectionId, rawMessage] = match;
	let cleanMessage = rawMessage;
	for (const re of FIELD_STRIPS) cleanMessage = cleanMessage.replace(re, "");
	return {
		time: new Date(timeRaw.replace(/\//g, "-")),
		timeRaw,
		level,
		message: cleanMessage.trim(),
		clientIp: rawMessage.match(CLIENT_REGEX)?.[1] ?? "",
		server: rawMessage.match(SERVER_REGEX)?.[1]?.trim() ?? "",
		connectionId: connectionId ?? "",
		pid: pid ?? "",
		requestMethod: rawMessage.match(REQUEST_REGEX)?.[1] ?? "",
		requestPath: rawMessage.match(REQUEST_REGEX)?.[2] ?? "",
		requestProtocol: rawMessage.match(REQUEST_REGEX)?.[3] ?? "",
		host: rawMessage.match(HOST_REGEX)?.[1] ?? "",
		referrer: rawMessage.match(REFERRER_REGEX)?.[1] ?? "",
		upstream: rawMessage.match(UPSTREAM_REGEX)?.[1] ?? "",
	};
}

function matchesFilter(entry, filter) {
	if (!filter) return true;
	if (filter.level && entry.level.toLowerCase() !== filter.level.toLowerCase()) return false;
	if (filter.server && !entry.server.toLowerCase().includes(filter.server.toLowerCase())) return false;
	if (filter.ip && entry.clientIp !== filter.ip) return false;
	if (filter.from && entry.time < filter.from) return false;
	if (filter.to && entry.time > filter.to) return false;
	if (filter.search) {
		const s = filter.search.toLowerCase();
		const haystack = `${entry.message} ${entry.server} ${entry.clientIp} ${entry.level} ${entry.host} ${entry.upstream} ${entry.requestMethod} ${entry.requestPath}`.toLowerCase();
		if (!haystack.includes(s)) return false;
	}
	return true;
}

export async function readErrorLogs(options = {}) {
	const { limit = 100, offset = 0, filter } = options;
	const allEntries = [];
	let totalLinesRead = 0;
	const logFiles = rotatedFiles(NGINX_ERROR_LOG, NGINX_LOG_ROTATIONS);

	for (const file of logFiles) {
		if (totalLinesRead >= MAX_LINES) break;
		const lines = await readLines(file);
		totalLinesRead += lines.length;
		for (let i = lines.length - 1; i >= 0; i--) {
			const entry = parseErrorLog(lines[i]);
			if (entry && matchesFilter(entry, filter)) allEntries.push(entry);
		}
	}

	return { entries: allEntries.slice(offset, offset + limit), total: allEntries.length };
}
