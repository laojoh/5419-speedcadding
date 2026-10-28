import { addDays, isDifficulty, MAX_PARTS, type Difficulty } from '#lib/challenges.ts';
import { today } from './db.ts';
import { checkUpload, MAX_UPLOAD_MB } from './files.ts';

export interface ChallengeFormValues {
	title: string;
	difficulty: string;
	week: string;
	cadUrl: string;
	description: string;
}

export function isUrl(value: string) {
	try {
		const u = new URL(value);
		return u.protocol === 'https:' || u.protocol === 'http:';
	} catch {
		return false;
	}
}

const asFile = (v: FormDataEntryValue | null) => (v instanceof File && v.size > 0 ? v : null);

/**
 * Reads and validates the admin challenge form.
 * `existing` is the challenge's current part drawings when editing (empty when creating).
 */
export async function readChallengeForm(form: FormData, existing: string[] = []) {
	const values: ChallengeFormValues = {
		title: String(form.get('title') ?? '').trim(),
		difficulty: String(form.get('difficulty') ?? ''),
		week: String(form.get('week') ?? ''),
		cadUrl: String(form.get('cadUrl') ?? '').trim(),
		description: String(form.get('description') ?? '').trim()
	};
	const newDrawings = form.getAll('drawings').map(asFile).filter((f): f is File => f !== null);
	const removed = new Set(form.getAll('removeDrawing').map(String));
	const keptDrawings = existing.filter((d) => !removed.has(d));
	const assemblyDrawing = asFile(form.get('assemblyDrawing'));

	const errors: Partial<Record<keyof ChallengeFormValues | 'drawings' | 'assemblyDrawing', string>> = {};
	if (!values.title) errors.title = 'Give it a name.';
	else if (values.title.length > 60) errors.title = 'Keep it under 60 characters.';
	if (!isDifficulty(values.difficulty)) errors.difficulty = 'Pick a difficulty.';
	if (!/^\d{4}-\d{2}-\d{2}$/.test(values.week)) errors.week = 'Pick the week’s start date.';
	if (values.cadUrl && !isUrl(values.cadUrl)) errors.cadUrl = 'That doesn’t look like a link.';
	if (values.description.length > 1000) errors.description = 'Keep it under 1000 characters.';

	const partCount = keptDrawings.length + newDrawings.length;
	if (partCount === 0) errors.drawings = 'Upload at least one technical drawing.';
	else if (partCount > MAX_PARTS) errors.drawings = `Up to ${MAX_PARTS} part drawings.`;
	for (const file of newDrawings) {
		const error = await checkUpload(file);
		if (error) errors.drawings = `${file.name}: ${error}`;
	}
	const assemblyError = await checkUpload(assemblyDrawing);
	if (assemblyError) errors.assemblyDrawing = assemblyError;
	const totalBytes = [...newDrawings, assemblyDrawing].reduce((n, f) => n + (f?.size ?? 0), 0);
	if (totalBytes > MAX_UPLOAD_MB * 1024 * 1024) {
		errors.drawings = `All the files together must be under ${MAX_UPLOAD_MB} MB. Add some, save, then edit to add the rest.`;
	}

	return {
		values,
		difficulty: values.difficulty as Difficulty,
		keptDrawings,
		removedDrawings: existing.filter((d) => removed.has(d)),
		newDrawings,
		assemblyDrawing,
		errors,
		ok: Object.keys(errors).length === 0
	};
}

/** Monday of the current week as YYYY-MM-DD, the default for new challenges. */
export function thisMonday() {
	const t = today();
	const [y, m, d] = t.split('-').map(Number);
	const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
	return addDays(t, -((weekday + 6) % 7));
}
