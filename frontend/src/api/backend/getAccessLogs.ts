import * as api from "./base";
import type { AccessLogEntry, AccessLogFilter, PaginatedLogs } from "./logsModels";

export async function getAccessLogs(filter: AccessLogFilter = {}): Promise<PaginatedLogs<AccessLogEntry>> {
	return await api.get({ url: "/logs/access", params: filter as Record<string, any> });
}
