import { useEffect, useRef } from "react";

type LogEventType = "access" | "error" | "waf";

interface LogEventHandlers {
	access?: (entry: unknown) => void;
	error?: (entry: unknown) => void;
	waf?: (entry: unknown) => void;
}

// Subscribes to /api/logs/events (SSE). Cookie auth flows automatically.
// Reconnects on transport errors via the browser's native EventSource backoff.
export const useLogsLiveStream = (handlers: LogEventHandlers, enabled = true) => {
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

	useEffect(() => {
		if (!enabled) return;
		const es = new EventSource("/api/logs/events", { withCredentials: true });

		const wire = (type: LogEventType) => {
			es.addEventListener(type, (ev) => {
				try {
					const data = JSON.parse((ev as MessageEvent).data);
					handlersRef.current[type]?.(data);
				} catch {
					/* ignore malformed payload */
				}
			});
		};
		wire("access");
		wire("error");
		wire("waf");

		return () => es.close();
	}, [enabled]);
};
