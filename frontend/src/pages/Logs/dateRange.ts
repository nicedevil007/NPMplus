// The <input type="datetime-local"> gives us "YYYY-MM-DDTHH:mm" in the
// USER'S LOCAL timezone (no offset info). The backend expects an ISO-8601
// timestamp. new Date(localString) interprets the value as local time,
// toISOString() converts to UTC — round-trip safe for the user's intent.
export function localToIso(localValue: string | undefined): string | undefined {
	if (!localValue) return undefined;
	const d = new Date(localValue);
	if (Number.isNaN(d.getTime())) return undefined;
	return d.toISOString();
}
