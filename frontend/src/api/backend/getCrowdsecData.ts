import * as api from "./base";
import type { CrowdsecAlert, CrowdsecDecision, LogsAvailability } from "./logsModels";

export async function getCrowdsecDecisions(includeCapi = false): Promise<CrowdsecDecision[]> {
	return await api.get({
		url: "/logs/crowdsec/decisions",
		params: { includeCapi },
	});
}

export async function getCrowdsecAlerts(limit = 50): Promise<CrowdsecAlert[]> {
	return await api.get({ url: "/logs/crowdsec/alerts", params: { limit } });
}

export async function getLogsAvailability(): Promise<LogsAvailability> {
	return await api.get({ url: "/logs/availability" });
}
