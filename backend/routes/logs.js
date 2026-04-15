import { watch } from "node:fs";
import express from "express";
import internalLogs from "../internal/logs.js";
import jwtdecode from "../lib/express/jwt-decode.js";
import {
	NGINX_ACCESS_LOG,
	NGINX_ERROR_LOG,
	OPENAPPSEC_WAF_LOG,
} from "../lib/logs/paths.js";
import { parseAccessLog } from "../lib/logs/parsers/access-log.js";
import { parseErrorLog } from "../lib/logs/parsers/error-log.js";
import { parseWafLog } from "../lib/logs/parsers/waf-log.js";
import { debug, express as logger } from "../logger.js";

const router = express.Router({
	caseSensitive: true,
	strict: true,
	mergeParams: true,
});

function makeHandler(fn) {
	return async (req, res, next) => {
		try {
			const data = await fn(res.locals.access, req.query);
			res.status(200).send(data);
		} catch (err) {
			debug(logger, `${req.method.toUpperCase()} ${req.originalUrl}: ${err}`);
			next(err);
		}
	};
}

router
	.route("/availability")
	.options((_, res) => res.sendStatus(204))
	.all(jwtdecode())
	.get(makeHandler((access) => internalLogs.availability(access)));

router
	.route("/access")
	.options((_, res) => res.sendStatus(204))
	.all(jwtdecode())
	.get(makeHandler((access, query) => internalLogs.access(access, query)));

router
	.route("/errors")
	.options((_, res) => res.sendStatus(204))
	.all(jwtdecode())
	.get(makeHandler((access, query) => internalLogs.errors(access, query)));

router
	.route("/waf")
	.options((_, res) => res.sendStatus(204))
	.all(jwtdecode())
	.get(makeHandler((access, query) => internalLogs.waf(access, query)));

router
	.route("/crowdsec/decisions")
	.options((_, res) => res.sendStatus(204))
	.all(jwtdecode())
	.get(makeHandler((access, query) => internalLogs.crowdsecDecisions(access, query)));

router
	.route("/crowdsec/alerts")
	.options((_, res) => res.sendStatus(204))
	.all(jwtdecode())
	.get(makeHandler((access, query) => internalLogs.crowdsecAlerts(access, query)));

// --- SSE: live tail of the three log files ---
//
// Pushes the last line of access.log / error.log / WAF log whenever the
// file changes, debounced per-file. Cookie auth is honored via jwtdecode().
// Client uses native EventSource which auto-sends the JWT cookie.

const SSE_DEBOUNCE_MS = 500;

function tailLastLine(filePath) {
	return new Promise((resolve) => {
		import("node:fs").then(({ createReadStream, statSync }) => {
			try {
				const size = statSync(filePath).size;
				const start = Math.max(0, size - 8192);
				const stream = createReadStream(filePath, { start, encoding: "utf-8" });
				let buf = "";
				stream.on("data", (c) => { buf += c; });
				stream.on("end", () => {
					const lines = buf.split("\n").filter((l) => l.trim());
					resolve(lines[lines.length - 1] || null);
				});
				stream.on("error", () => resolve(null));
			} catch {
				resolve(null);
			}
		});
	});
}

router.get("/events", jwtdecode(), async (req, res, next) => {
	try {
		// Auth check — same permission as other endpoints
		await res.locals.access.can("logs:list", 1);
	} catch (err) {
		return next(err);
	}

	res.set({
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive",
		"X-Accel-Buffering": "no",
	});
	res.flushHeaders?.();

	const send = (event, payload) => {
		res.write(`event: ${event}\n`);
		res.write(`data: ${JSON.stringify(payload)}\n\n`);
	};

	send("hello", { ok: true });

	const watchers = [];
	const debounceTimers = new Map();

	const setupWatch = (filePath, type, parser) => {
		try {
			const w = watch(filePath, () => {
				clearTimeout(debounceTimers.get(filePath));
				debounceTimers.set(
					filePath,
					setTimeout(async () => {
						const line = await tailLastLine(filePath);
						if (!line) return;
						const entry = parser(line);
						if (entry) send(type, entry);
					}, SSE_DEBOUNCE_MS),
				);
			});
			w.on("error", () => {});
			watchers.push(w);
		} catch {
			// File not present — silently skip; UI still works via polling fallback
		}
	};

	setupWatch(NGINX_ACCESS_LOG, "access", parseAccessLog);
	setupWatch(NGINX_ERROR_LOG, "error", parseErrorLog);
	setupWatch(OPENAPPSEC_WAF_LOG, "waf", parseWafLog);

	const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

	req.on("close", () => {
		clearInterval(heartbeat);
		for (const t of debounceTimers.values()) clearTimeout(t);
		for (const w of watchers) {
			try { w.close(); } catch {}
		}
	});
});

export default router;
