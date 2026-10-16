/** Parse "1:23.45", "83.45", "1:02:03" or "83" into milliseconds. Returns null if invalid. */
export function parseTime(input: string): number | null {
	const parts = input.trim().split(':');
	if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d{1,3})?$/.test(p))) return null;
	// Only the last part (seconds) may have decimals.
	if (parts.slice(0, -1).some((p) => p.includes('.'))) return null;

	let seconds = 0;
	for (const p of parts) seconds = seconds * 60 + Number(p);
	const ms = Math.round(seconds * 1000);
	return ms > 0 ? ms : null;
}

/** Format milliseconds as m:ss.cc (or h:mm:ss.cc for long runs). */
export function formatTime(ms: number): string {
	const cs = Math.floor((ms % 1000) / 10);
	const totalSeconds = Math.floor(ms / 1000);
	const s = totalSeconds % 60;
	const m = Math.floor(totalSeconds / 60) % 60;
	const h = Math.floor(totalSeconds / 3600);
	const tail = `${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
	return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${tail}` : `${m}:${tail}`;
}
