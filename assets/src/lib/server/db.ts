import { addDays, byDifficulty, type Challenge } from '#lib/challenges.ts';
import { store } from './store.ts';

export type Status = 'pending' | 'approved' | 'rejected';

export interface Submission {
	id: string;
	name: string;
	team: string;
	challengeId: string;
	/** Official time: what the runner entered, until an admin times the video on approval. */
	timeMs: number;
	/** The runner's own time, kept once an admin sets a different official time. */
	claimedMs?: number;
	videoUrl: string;
	cadUrl: string;
	notes: string;
	status: Status;
	submittedAt: string;
}

// Weeks roll over on Berkeley time, whatever timezone the server runs in (Vercel uses UTC).
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' });

/** A date as YYYY-MM-DD in the team's timezone (defaults to today). */
export const localDate = (d = new Date()) => dateFormat.format(d);

export const today = () => localDate();

/** Challenges saved before multi-part drawings had a single `drawing` instead of `drawings`. */
type StoredChallenge = Challenge & { drawing?: string };

const allChallenges = async () =>
	(await store.all<StoredChallenge>('challenges')).map(({ drawing, ...c }) => ({
		...c,
		drawings: c.drawings ?? (drawing ? [drawing] : []),
		description: c.description ?? ''
	}));

/**
 * The day a week ends (exclusive): 7 days after it starts, or sooner if the next week's
 * challenges start before that. `weeks` is every challenge's week, scheduled ones included.
 */
function endOfWeek(week: string, weeks: string[]) {
	const sevenDays = addDays(week, 7);
	const next = weeks.filter((w) => w > week).sort()[0];
	return next && next < sevenDays ? next : sevenDays;
}

export async function weekEnd(challenge: Challenge) {
	return endOfWeek(challenge.week, (await allChallenges()).map((c) => c.week));
}

/** Whether a run was submitted before the challenge's week ended. */
export const duringWeek = (end: string) => (s: Submission) => localDate(new Date(s.submittedAt)) < end;

// Challenges

export async function listChallenges({ includeScheduled = false } = {}) {
	const now = today();
	return (await allChallenges())
		.filter((c) => includeScheduled || c.week <= now)
		.sort((a, b) => b.week.localeCompare(a.week) || byDifficulty(a, b));
}

export async function getChallenge(id: string, { includeScheduled = false } = {}) {
	const c = (await allChallenges()).find((c) => c.id === id);
	return c && (includeScheduled || c.week <= today()) ? c : undefined;
}

/**
 * Published challenges split into the current week (null once its 7 days are up and nothing
 * newer has started) and older weeks, newest first.
 */
export async function challengesByWeek() {
	const challenges = await allChallenges();
	const now = today();
	const weeks = new Map<string, Challenge[]>();
	for (const c of challenges
		.filter((c) => c.week <= now)
		.sort((a, b) => b.week.localeCompare(a.week) || byDifficulty(a, b))) {
		if (!weeks.has(c.week)) weeks.set(c.week, []);
		weeks.get(c.week)!.push(c);
	}
	const all = [...weeks].map(([week, challenges]) => ({ week, challenges }));
	const allWeeks = challenges.map((c) => c.week);
	const current = all[0] && now < endOfWeek(all[0].week, allWeeks) ? all[0] : null;
	return { current, archive: current ? all.slice(1) : all };
}

export async function addChallenge(c: Omit<Challenge, 'id' | 'createdAt'>) {
	const slug = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
	const challenge: Challenge = {
		...c,
		id: `${slug || 'challenge'}-${crypto.randomUUID().slice(0, 6)}`,
		createdAt: new Date().toISOString()
	};
	await store.put('challenges', challenge);
	return challenge;
}

export async function updateChallenge(id: string, changes: Partial<Omit<Challenge, 'id' | 'createdAt'>>) {
	const c = (await allChallenges()).find((c) => c.id === id);
	if (!c) return undefined;
	const updated = { ...c, ...changes };
	await store.put('challenges', updated);
	return updated;
}

/** Deletes the challenge and its runs. Returns the removed challenge so its drawings can be cleaned up. */
export async function deleteChallenge(id: string) {
	const c = (await allChallenges()).find((c) => c.id === id);
	if (!c) return undefined;
	const runs = (await listSubmissions()).filter((s) => s.challengeId === id);
	await store.remove('submissions', runs.map((s) => s.id));
	await store.remove('challenges', [id]);
	return c;
}

// Submissions

export async function listSubmissions(status?: Status) {
	const submissions = await store.all<Submission>('submissions');
	return status ? submissions.filter((s) => s.status === status) : submissions;
}

export async function addSubmission(s: Omit<Submission, 'id' | 'status' | 'submittedAt'>) {
	const sub: Submission = {
		...s,
		id: crypto.randomUUID(),
		status: 'pending',
		submittedAt: new Date().toISOString()
	};
	await store.put('submissions', sub);
	return sub;
}

/** Sets a run's status. Passing `timeMs` also records it as the official time. */
export async function setStatus(id: string, status: Status, timeMs?: number) {
	const sub = (await listSubmissions()).find((s) => s.id === id);
	if (!sub) return false;
	sub.status = status;
	if (timeMs !== undefined && timeMs !== sub.timeMs) {
		sub.claimedMs ??= sub.timeMs;
		sub.timeMs = timeMs;
	}
	await store.put('submissions', sub);
	return true;
}

export async function deleteSubmission(id: string) {
	await store.remove('submissions', [id]);
}

export interface RankedEntry {
	rank: number;
	name: string;
	team: string;
	timeMs: number;
	videoUrl: string;
	cadUrl: string;
	submittedAt: string;
}

export const runnerKey = (s: { name: string; team: string }) => `${s.name.trim().toLowerCase()}|${s.team}`;

/** Approved runs for a challenge: each person's best time, fastest first. */
export function leaderboard(
	submissions: Submission[],
	challengeId: string,
	include: (s: Submission) => boolean = () => true
): RankedEntry[] {
	const best = new Map<string, Submission>();
	for (const s of submissions) {
		if (s.status !== 'approved' || s.challengeId !== challengeId || !include(s)) continue;
		const prev = best.get(runnerKey(s));
		if (!prev || s.timeMs < prev.timeMs) best.set(runnerKey(s), s);
	}
	return [...best.values()]
		.sort((a, b) => a.timeMs - b.timeMs || a.submittedAt.localeCompare(b.submittedAt))
		.map((s, i) => ({
			rank: i + 1,
			name: s.name,
			team: s.team,
			timeMs: s.timeMs,
			videoUrl: s.videoUrl,
			cadUrl: s.cadUrl,
			submittedAt: s.submittedAt
		}));
}
