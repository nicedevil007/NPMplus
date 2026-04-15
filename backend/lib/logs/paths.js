// Container-internal log/config paths. Mounted via compose.yaml; missing
// paths cause the corresponding feature to gracefully degrade (frontend
// hides the tab, endpoints return empty/disabled).

export const NGINX_ACCESS_LOG = "/data/nginx/logs/access.log";
export const NGINX_ERROR_LOG = "/data/nginx/logs/error.log";
export const NGINX_LOG_ROTATIONS = 7;

export const OPENAPPSEC_WAF_LOG = "/data/openappsec-logs/cp-nano-http-transaction-handler.log";
export const OPENAPPSEC_WAF_LOG_ROTATIONS = 4;
export const OPENAPPSEC_POLICY = "/data/openappsec-conf/local_policy.yaml";
export const OPENAPPSEC_LEARNING_BASE = "/data/openappsec-conf/svc";

export const CROWDSEC_LAPI_URL = process.env.CROWDSEC_LAPI_URL || "http://127.0.0.1:8080";
export const CROWDSEC_CREDENTIALS = "/data/crowdsec-conf/local_api_credentials.yaml";
