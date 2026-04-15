import * as api from "./base";
import type { ErrorLogEntry, ErrorLogFilter, PaginatedLogs } from "./logsModels";

export async function getErrorLogs(filter: ErrorLogFilter = {}): Promise<PaginatedLogs<ErrorLogEntry>> {
	return await api.get({ url: "/logs/errors", params: filter as Record<string, any> });
}
