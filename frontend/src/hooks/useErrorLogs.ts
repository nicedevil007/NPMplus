import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ErrorLogFilter, getErrorLogs } from "src/api/backend";

export const useErrorLogs = (filter: ErrorLogFilter = {}, options = {}) => {
	return useQuery({
		queryKey: ["logs-errors", filter],
		queryFn: () => getErrorLogs(filter),
		staleTime: 5 * 1000,
		placeholderData: keepPreviousData,
		...options,
	});
};
