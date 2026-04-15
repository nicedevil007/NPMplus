import { useQuery } from "@tanstack/react-query";
import { getCrowdsecAlerts, getCrowdsecDecisions, getLogsAvailability } from "src/api/backend";

export const useCrowdsecDecisions = (includeCapi = false, options = {}) => {
	return useQuery({
		queryKey: ["crowdsec-decisions", includeCapi],
		queryFn: () => getCrowdsecDecisions(includeCapi),
		staleTime: 10 * 1000,
		...options,
	});
};

export const useCrowdsecAlerts = (limit = 50, options = {}) => {
	return useQuery({
		queryKey: ["crowdsec-alerts", limit],
		queryFn: () => getCrowdsecAlerts(limit),
		staleTime: 10 * 1000,
		...options,
	});
};

export const useLogsAvailability = (options = {}) => {
	return useQuery({
		queryKey: ["logs-availability"],
		queryFn: getLogsAvailability,
		staleTime: 60 * 1000,
		...options,
	});
};
