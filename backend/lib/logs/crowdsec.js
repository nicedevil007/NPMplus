import { readFile } from "node:fs/promises";
import { CROWDSEC_CREDENTIALS, CROWDSEC_LAPI_URL } from "./paths.js";

// local_api_credentials.yaml is a flat key:value file maintained by CrowdSec
// itself - we parse it with a tiny regex to avoid pulling in a YAML lib.
function parseFlatYaml(text) {
	const out = {};
	for (const line of text.split(/\r?\n/)) {
		const m = line.match(/^\s*([a-zA-Z_][\w-]*)\s*:\s*(.+?)\s*$/);
		if (!m) continue;
		let value = m[2];
		if ((value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		out[m[1]] = value;
	}
	return out;
}

let cachedCreds = null;
let credsLoadAttempted = false;

async function loadCredentials() {
	if (credsLoadAttempted) return cachedCreds;
	credsLoadAttempted = true;
	try {
		const raw = await readFile(CROWDSEC_CREDENTIALS, "utf-8");
		const doc = parseFlatYaml(raw);
		if (doc.login && doc.password) {
			cachedCreds = { login: doc.login, password: doc.password, url: doc.url || CROWDSEC_LAPI_URL };
		}
	} catch {
		// File missing -> CrowdSec features stay disabled
	}
	return cachedCreds;
}

let machineToken = null;
let tokenExpiry = 0;

async function getMachineToken() {
	if (machineToken && Date.now() < tokenExpiry) return machineToken;
	const creds = await loadCredentials();
	if (!creds) throw new Error("CROWDSEC_DISABLED");

	const res = await fetch(`${creds.url}/v1/watchers/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ machine_id: creds.login, password: creds.password }),
	});
	if (!res.ok) throw new Error(`Machine login failed: ${res.status}`);

	const data = await res.json();
	machineToken = data.token;
	tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
	return machineToken;
}

async function authedFetch(path, init = {}) {
	const creds = await loadCredentials();
	if (!creds) throw new Error("CROWDSEC_DISABLED");
	const token = await getMachineToken();
	return fetch(`${creds.url}${path}`, {
		...init,
		headers: {
			...(init.headers || {}),
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
}

export async function isCrowdsecAvailable() {
	const creds = await loadCredentials();
	return creds !== null;
}

export async function getDecisions(includeCAPI = false) {
	try {
		const params = includeCAPI ? "" : "?origins=crowdsec";
		const res = await authedFetch(`/v1/decisions${params}`);
		if (!res.ok) return [];
		const data = await res.json();
		if (!Array.isArray(data)) return [];
		return data.map((d) => ({
			id: String(d.id ?? ""),
			ip: String(d.value ?? ""),
			type: String(d.type ?? ""),
			scope: String(d.scope ?? ""),
			value: String(d.value ?? ""),
			duration: String(d.duration ?? ""),
			origin: String(d.origin ?? ""),
			scenario: String(d.scenario ?? ""),
			created_at: String(d.created_at ?? ""),
		}));
	} catch {
		return [];
	}
}

export async function getAlerts(limit = 50) {
	try {
		const res = await authedFetch(`/v1/alerts?limit=${limit}`);
		if (!res.ok) return [];
		const data = await res.json();
		return Array.isArray(data) ? data : [];
	} catch {
		return [];
	}
}

