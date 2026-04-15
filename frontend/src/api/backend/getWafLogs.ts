import * as api from "./base";
import type { PaginatedLogs, WafEvent, WafLogFilter } from "./logsModels";

export async function getWafLogs(filter: WafLogFilter = {}): Promise<PaginatedLogs<WafEvent>> {
	return await api.get({ url: "/logs/waf", params: filter as Record<string, any> });
}
