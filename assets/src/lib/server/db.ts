import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_DIR } from '$app/env/private';
import { addDays, byDifficulty, type Challenge } from '#lib/challenges.ts';

export type Status = 'pending' | 'approved' | 'rejected';

export interface Submission {
	id: string;
	name: string;
	team: string;
	challengeId: string;
	timeMs: number;
	videoUrl: string;
	cadUrl: string;
	notes: string;
	status: Status;
	submittedAt: string;
}

interface Data {
	challenges: Challenge[];
	submissions: Submission[];
}

const file = join(DATA_DIR, 'db.json');

async function load(): Promise<Data> {
	try {
		const data = JSON.parse(await readFile(file, 'utf8'));
		return { challenges: data.challenges ?? [], submissions: data.submissions ?? [] };
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { challenges: [], submissions: [] };
		throw e;
	}
}

// Serialize writes so two requests arriving at once don't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

function update<T>(fn: (data: Data) => T): Promise<T> {
	const run = queue.then(async () => {
		const data = await load();
		const result = fn(data);
		await mkdir(DATA_DIR, { recursive: true });
		await writeFile(file + '.tmp', JSON.stringify(data, null, '\t'));
		await rename(file + '.tmp', file);
		return result;
	});
	queue = run.catch(() => {});
	return run;
}

/** A date as YYYY-MM-DD in the server's timezone (defaults to today). */
export function localDate(d = new Date()) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const today = () => localDate();

/**
 * The day a challenge's week ends (exclusive): when the next week's challenges start,
 * or 7 days after it started if nothing newer is scheduled.
 */
export async function weekEnd(challenge: Challenge) {
	const { challenges } = await load();
	const next = challenges
		.map((c) => c.week)
		.filter((w) => w > challenge.week)
		.sort()[0];
	return next ?? addDays(challenge.week, 7);
}

/** Whether a run was submitted before the challenge's week ended. */
export const duringWeek = (end: string) => (s: Submission) => localDate(new Date(s.submittedAt)) < end;

// Challenges

export async function listChallenges({ includeScheduled = false } = {}) {
	const { challenges } = await load();
	const now = today();
	return challenges
		.filter((c) => includeScheduled || c.week <= now)
		.sort((a, b) => b.week.localeCompare(a.week) || byDifficulty(a, b));
}

export async function getChallenge(id: string, { includeScheduled = false } = {}) {
	const c = (await load()).challenges.find((c) => c.id === id);
	return c && (includeScheduled || c.week <= today()) ? c : undefined;
}

/** Published challenges split into the current week and older weeks (newest first). */
export async function challengesByWeek() {
	const weeks = new Map<string, Challenge[]>();
	for (const c of await listChallenges()) {
		if (!weeks.has(c.week)) weeks.set(c.week, []);
		weeks.get(c.week)!.push(c);
	}
	const [current, ...archive] = [...weeks].map(([week, challenges]) => ({ week, challenges }));
	return { current: current ?? null, archive };
}

export function addChallenge(c: Omit<Challenge, 'id' | 'createdAt'>) {
	return update((data) => {
		const slug = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
		const challenge: Challenge = {
			...c,
			id: `${slug || 'challenge'}-${crypto.randomUUID().slice(0, 6)}`,
			createdAt: new Date().toISOString()
		};
		data.challenges.push(challenge);
		return challenge;
	});
}

export function updateChallenge(id: string, changes: Partial<Omit<Challenge, 'id' | 'createdAt'>>) {
	return update((data) => {
		const c = data.challenges.find((c) => c.id === id);
		if (c) Object.assign(c, changes);
		return c;
	});
}

/** Deletes the challenge and its runs. Returns the removed challenge so its files can be cleaned up. */
export function deleteChallenge(id: string) {
	return update((data) => {
		const c = data.challenges.find((c) => c.id === id);
		data.challenges = data.challenges.filter((c) => c.id !== id);
		data.submissions = data.submissions.filter((s) => s.challengeId !== id);
		return c;
	});
}

// Submissions

export async function listSubmissions(status?: Status) {
	const { submissions } = await load();
	return status ? submissions.filter((s) => s.status === status) : submissions;
}

export function addSubmission(s: Omit<Submission, 'id' | 'status' | 'submittedAt'>) {
	return update((data) => {
		const sub: Submission = {
			...s,
			id: crypto.randomUUID(),
			status: 'pending',
			submittedAt: new Date().toISOString()
		};
		data.submissions.push(sub);
		return sub;
	});
}

export function setStatus(id: string, status: Status) {
	return update((data) => {
		const sub = data.submissions.find((s) => s.id === id);
		if (sub) sub.status = status;
		return !!sub;
	});
}

export function deleteSubmission(id: string) {
	return update((data) => {
		data.submissions = data.submissions.filter((s) => s.id !== id);
	});
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
