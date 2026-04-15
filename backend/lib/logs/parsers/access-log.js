import { readLines, rotatedFiles } from "../file-reader.js";
import { NGINX_ACCESS_LOG, NGINX_LOG_ROTATIONS } from "../paths.js";
import { parseNginxDate } from "../utils.js";

const ACCESS_LOG_REGEX =
	/\[(.+?)\] (\S+) (\S+) (\S+) "(\S+) (.+?) (\S+)" (\d+) (\d+) (\d+) (\S+) (.+)/;
const MAX_LINES = 100_000;

export function parseAccessLog(line) {
	const match = line.match(ACCESS_LOG_REGEX);
	if (!match) return null;
	const [, timeRaw, host, clientIp, requestTime, method, path, protocol, status, bodyBytes, totalBytes, referer, userAgent] = match;
	return {
		time: parseNginxDate(timeRaw),
		timeRaw,
		host,
		clientIp,
		requestTime: Number.parseFloat(requestTime),
		method,
		path,
		protocol,
		status: Number.parseInt(status, 10),
		bodyBytes: Number.parseInt(bodyBytes, 10),
		totalBytes: Number.parseInt(totalBytes, 10),
		referer: referer === "-" ? "" : referer,
		userAgent,
	};
}

function isHealthcheck(entry) {
	return (
		entry.userAgent.includes("NPMplus/healthcheck") ||
		entry.userAgent === "ansible-httpget"
	);
}

function matchesFilter(entry, filter) {
	if (!filter?.includeHealthchecks && isHealthcheck(entry)) return false;
	if (!filter) return true;
	if (filter.host && !entry.host.toLowerCase().includes(filter.host.toLowerCase())) return false;
	if (filter.statusRange) {
		const prefix = Number.parseInt(filter.statusRange[0], 10);
		if (prefix !== Math.floor(entry.status / 100)) return false;
	}
	if (filter.ip && entry.clientIp !== filter.ip) return false;
	if (filter.from && entry.time < filter.from) return false;
	if (filter.to && entry.time > filter.to) return false;
	if (filter.search) {
		const s = filter.search.toLowerCase();
		const haystack = `${entry.host} ${entry.path} ${entry.userAgent} ${entry.clientIp} ${entry.referer} ${entry.method} ${entry.status} ${entry.protocol}`.toLowerCase();
		if (!haystack.includes(s)) return false;
	}
	return true;
}

export async function readAccessLogs(options = {}) {
	const { limit = 100, offset = 0, filter } = options;
	const allEntries = [];
	let totalLinesRead = 0;
	const logFiles = rotatedFiles(NGINX_ACCESS_LOG, NGINX_LOG_ROTATIONS);

	for (const file of logFiles) {
		if (totalLinesRead >= MAX_LINES) break;
		const lines = await readLines(file);
		totalLinesRead += lines.length;
		for (let i = lines.length - 1; i >= 0; i--) {
			const entry = parseAccessLog(lines[i]);
			if (entry && matchesFilter(entry, filter)) allEntries.push(entry);
		}
	}

	return { entries: allEntries.slice(offset, offset + limit), total: allEntries.length };
}
