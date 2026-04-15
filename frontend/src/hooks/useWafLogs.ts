import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getWafLogs, type WafLogFilter } from "src/api/backend";

export const useWafLogs = (filter: WafLogFilter = {}, options = {}) => {
	return useQuery({
		queryKey: ["logs-waf", filter],
		queryFn: () => getWafLogs(filter),
		staleTime: 5 * 1000,
		placeholderData: keepPreviousData,
		...options,
	});
};
