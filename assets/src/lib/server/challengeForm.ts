import { isDifficulty, type Difficulty } from '#lib/challenges.ts';
import { checkUpload } from './files.ts';

export interface ChallengeFormValues {
	title: string;
	difficulty: string;
	week: string;
	cadUrl: string;
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

/** Reads and validates the admin challenge form. `requireDrawing` is true when creating. */
export async function readChallengeForm(form: FormData, requireDrawing: boolean) {
	const values: ChallengeFormValues = {
		title: String(form.get('title') ?? '').trim(),
		difficulty: String(form.get('difficulty') ?? ''),
		week: String(form.get('week') ?? ''),
		cadUrl: String(form.get('cadUrl') ?? '').trim()
	};
	const drawing = asFile(form.get('drawing'));
	const assemblyDrawing = asFile(form.get('assemblyDrawing'));

	const errors: Partial<Record<keyof ChallengeFormValues | 'drawing' | 'assemblyDrawing', string>> = {};
	if (!values.title) errors.title = 'Give it a name.';
	else if (values.title.length > 60) errors.title = 'Keep it under 60 characters.';
	if (!isDifficulty(values.difficulty)) errors.difficulty = 'Pick a difficulty.';
	if (!/^\d{4}-\d{2}-\d{2}$/.test(values.week)) errors.week = 'Pick the week’s start date.';
	if (values.cadUrl && !isUrl(values.cadUrl)) errors.cadUrl = 'That doesn’t look like a link.';
	if (requireDrawing && !drawing) errors.drawing = 'Upload the technical drawing.';
	const drawingError = await checkUpload(drawing);
	if (drawingError) errors.drawing = drawingError;
	const assemblyError = await checkUpload(assemblyDrawing);
	if (assemblyError) errors.assemblyDrawing = assemblyError;

	return {
		values,
		difficulty: values.difficulty as Difficulty,
		drawing,
		assemblyDrawing,
		errors,
		ok: Object.keys(errors).length === 0
	};
}

/** Monday of the current week as YYYY-MM-DD, the default for new challenges. */
export function thisMonday() {
	const d = new Date();
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
