import { readLines, rotatedFiles } from "../file-reader.js";
import { OPENAPPSEC_WAF_LOG, OPENAPPSEC_WAF_LOG_ROTATIONS } from "../paths.js";

const MAX_LINES = 100_000;

export function parseWafLog(line) {
	let obj;
	try {
		obj = JSON.parse(line);
	} catch {
		return null;
	}
	if (obj.eventAudience !== "Security") return null;
	const ed = obj.eventData ?? {};
	if (!ed.securityAction) return null;
	return {
		eventTime: new Date(obj.eventTime),
		eventSeverity: obj.eventSeverity ?? "Info",
		sourceIp: ed.sourceIP ?? "",
		httpHostName: ed.httpHostName ?? "",
		httpMethod: ed.httpMethod ?? "",
		httpUriPath: ed.httpUriPath ?? "",
		securityAction: ed.securityAction ?? "",
		waapIncidentType: ed.waapIncidentType ?? "",
		matchedSample: ed.matchedSample ?? "",
		matchedLocation: ed.matchedLocation ?? "",
		matchedParameter: ed.matchedParameter ?? "",
		waapFinalScore: ed.waapFinalScore ?? 0,
		eventReferenceId: ed.eventReferenceId ?? "",
		rawJson: obj,
	};
}

function matchesFilter(event, filter) {
	if (!filter) return true;
	if (filter.severity && event.eventSeverity.toLowerCase() !== filter.severity.toLowerCase()) return false;
	if (filter.incidentType && !event.waapIncidentType.toLowerCase().includes(filter.incidentType.toLowerCase())) return false;
	if (filter.host && !event.httpHostName.toLowerCase().includes(filter.host.toLowerCase())) return false;
	if (filter.ip && event.sourceIp !== filter.ip) return false;
	if (filter.from && event.eventTime < filter.from) return false;
	if (filter.to && event.eventTime > filter.to) return false;
	if (filter.search) {
		const s = filter.search.toLowerCase();
		const haystack = `${event.httpHostName} ${event.httpUriPath} ${event.sourceIp} ${event.waapIncidentType} ${event.matchedSample} ${event.matchedParameter} ${event.matchedLocation} ${event.securityAction} ${event.eventSeverity} ${event.httpMethod}`.toLowerCase();
		if (!haystack.includes(s)) return false;
	}
	return true;
}

export async function readWafLogs(options = {}) {
	const { limit = 100, offset = 0, filter } = options;
	const allEntries = [];
	const seenIds = new Set();
	let totalLinesRead = 0;
	const logFiles = rotatedFiles(OPENAPPSEC_WAF_LOG, OPENAPPSEC_WAF_LOG_ROTATIONS, "");

	for (const file of logFiles) {
		if (totalLinesRead >= MAX_LINES) break;
		const lines = await readLines(file);
		totalLinesRead += lines.length;
		for (let i = lines.length - 1; i >= 0; i--) {
			const event = parseWafLog(lines[i]);
			if (!event || !matchesFilter(event, filter)) continue;
			if (event.eventReferenceId) {
				if (seenIds.has(event.eventReferenceId)) continue;
				seenIds.add(event.eventReferenceId);
			}
			allEntries.push(event);
		}
	}

	return { entries: allEntries.slice(offset, offset + limit), total: allEntries.length };
}
