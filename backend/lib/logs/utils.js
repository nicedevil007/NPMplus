const MONTHS = {
	Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
	Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// Parse nginx date format: "07/Apr/2026:13:06:56 +0200"
export function parseNginxDate(dateStr) {
	const match = dateStr.match(
		/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s([+-]\d{4})/,
	);
	if (!match) return new Date(0);

	const [, day, monthStr, year, hours, minutes, seconds, tz] = match;
	const month = MONTHS[monthStr] ?? 0;
	const tzFormatted = `${tz.slice(0, 3)}:${tz.slice(3)}`;
	const iso = `${year}-${String(month + 1).padStart(2, "0")}-${day}T${hours}:${minutes}:${seconds}${tzFormatted}`;
	return new Date(iso);
}

export function getStatusBucket(status) {
	if (status >= 200 && status < 300) return "2xx";
	if (status >= 300 && status < 400) return "3xx";
	if (status >= 400 && status < 500) return "4xx";
	if (status >= 500) return "5xx";
	return "other";
}
