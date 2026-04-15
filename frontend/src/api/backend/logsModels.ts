export interface AccessLogEntry {
	time: string;
	timeRaw: string;
	host: string;
	clientIp: string;
	requestTime: number;
	method: string;
	path: string;
	protocol: string;
	status: number;
	bodyBytes: number;
	totalBytes: number;
	referer: string;
	userAgent: string;
}

export interface ErrorLogEntry {
	time: string;
	timeRaw: string;
	level: string;
	message: string;
	clientIp: string;
	server: string;
	connectionId: string;
	pid: string;
	requestMethod: string;
	requestPath: string;
	requestProtocol: string;
	host: string;
	referrer: string;
	upstream: string;
}

export interface WafEvent {
	eventTime: string;
	eventSeverity: string;
	sourceIp: string; // backend now returns camelCase (was sourceIP previously)
	httpHostName: string;
	httpMethod: string;
	httpUriPath: string;
	securityAction: string;
	waapIncidentType: string;
	matchedSample: string;
	matchedLocation: string;
	matchedParameter: string;
	waapFinalScore: number;
	eventReferenceId: string;
	rawJson: Record<string, unknown>;
}

export interface PaginatedLogs<T> {
	entries: T[];
	total: number;
}

export interface CrowdsecDecision {
	id: string;
	ip: string;
	type: string;
	scope: string;
	value: string;
	duration: string;
	origin: string;
	scenario: string;
	createdAt: string;
}

export interface CrowdsecAlert {
	id: number;
	scenario: string;
	scope: string;
	value: string;
	message: string;
	startAt: string;
	stopAt: string;
	createdAt: string;
	eventsCount: number;
	source: { ip: string; scope: string; value: string };
	decisions: CrowdsecDecision[] | null;
}

export interface LogsAvailability {
	crowdsec: boolean;
}

export interface AccessLogFilter {
	limit?: number;
	offset?: number;
	host?: string;
	status?: string;
	ip?: string;
	search?: string;
	from?: string;
	to?: string;
	includeHealthchecks?: boolean;
}

export interface ErrorLogFilter {
	limit?: number;
	offset?: number;
	level?: string;
	server?: string;
	ip?: string;
	search?: string;
	from?: string;
	to?: string;
}

export interface WafLogFilter {
	limit?: number;
	offset?: number;
	severity?: string;
	incidentType?: string;
	host?: string;
	ip?: string;
	search?: string;
	from?: string;
	to?: string;
}
