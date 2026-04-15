import { getAlerts, getDecisions, isCrowdsecAvailable } from "../lib/logs/crowdsec.js";
import { readAccessLogs } from "../lib/logs/parsers/access-log.js";
import { readErrorLogs } from "../lib/logs/parsers/error-log.js";
import { readWafLogs } from "../lib/logs/parsers/waf-log.js";

function parseDate(value) {
	if (!value) return undefined;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? undefined : d;
}

const internalLogs = {
	access: async (access, query = {}) => {
		await access.can("logs:list", 1);
		const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 1000);
		const offset = Math.max(Number.parseInt(query.offset, 10) || 0, 0);
		return readAccessLogs({
			limit,
			offset,
			filter: {
				host: query.host || undefined,
				statusRange: query.status || undefined,
				ip: query.ip || undefined,
				search: query.search || undefined,
				from: parseDate(query.from),
				to: parseDate(query.to),
				includeHealthchecks: query.include_healthchecks === "true" || query.include_healthchecks === true,
			},
		});
	},

	errors: async (access, query = {}) => {
		await access.can("logs:list", 1);
		const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 1000);
		const offset = Math.max(Number.parseInt(query.offset, 10) || 0, 0);
		return readErrorLogs({
			limit,
			offset,
			filter: {
				level: query.level || undefined,
				server: query.server || undefined,
				ip: query.ip || undefined,
				search: query.search || undefined,
				from: parseDate(query.from),
				to: parseDate(query.to),
			},
		});
	},

	waf: async (access, query = {}) => {
		await access.can("logs:list", 1);
		const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 1000);
		const offset = Math.max(Number.parseInt(query.offset, 10) || 0, 0);
		return readWafLogs({
			limit,
			offset,
			filter: {
				severity: query.severity || undefined,
				incidentType: query.incident_type || undefined,
				host: query.host || undefined,
				ip: query.ip || undefined,
				search: query.search || undefined,
				from: parseDate(query.from),
				to: parseDate(query.to),
			},
		});
	},

	crowdsecDecisions: async (access, query = {}) => {
		await access.can("logs:list", 1);
		return getDecisions(query.include_capi === "true" || query.include_capi === true);
	},

	crowdsecAlerts: async (access, query = {}) => {
		await access.can("logs:list", 1);
		const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 500);
		return getAlerts(limit);
	},

	availability: async (access) => {
		await access.can("logs:list", 1);
		return {
			crowdsec: await isCrowdsecAvailable(),
		};
	},
};

export default internalLogs;
