import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type AccessLogFilter, getAccessLogs } from "src/api/backend";

export const useAccessLogs = (filter: AccessLogFilter = {}, options = {}) => {
	return useQuery({
		queryKey: ["logs-access", filter],
		queryFn: () => getAccessLogs(filter),
		staleTime: 5 * 1000,
		placeholderData: keepPreviousData,
		...options,
	});
};
