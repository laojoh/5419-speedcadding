export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
	{ id: 'easy', label: 'Easy' },
	{ id: 'medium', label: 'Medium' },
	{ id: 'hard', label: 'Hard' }
];

export interface Challenge {
	id: string;
	title: string;
	difficulty: Difficulty;
	/** First day of the challenge's week, YYYY-MM-DD. Hidden from the public until then. */
	week: string;
	/** Public paths of the drawings in static/images, e.g. /images/gusset-1a2b3c.png */
	drawing: string;
	assemblyDrawing: string;
	cadUrl: string;
	createdAt: string;
}

export function isDifficulty(value: string): value is Difficulty {
	return DIFFICULTIES.some((d) => d.id === value);
}

export function difficultyLabel(d: Difficulty) {
	return DIFFICULTIES.find((x) => x.id === d)!.label;
}

const ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
export const byDifficulty = (a: Challenge, b: Challenge) => ORDER[a.difficulty] - ORDER[b.difficulty];

export const isPdf = (name: string) => name.endsWith('.pdf');

/** Shift a YYYY-MM-DD date by some days. */
export function addDays(date: string, days: number) {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "Oct 13, 2026" from "2026-10-13", without timezone shifts. */
export function formatWeek(week: string) {
	const [y, m, d] = week.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	});
}
