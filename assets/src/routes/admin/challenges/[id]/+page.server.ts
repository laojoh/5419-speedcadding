import { error, fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '#lib/server/auth.ts';
import { readChallengeForm } from '#lib/server/challengeForm.ts';
import { getChallenge, updateChallenge } from '#lib/server/db.ts';
import { removeDrawing, saveDrawing } from '#lib/server/files.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	requireAdmin(cookies);
	const challenge = await getChallenge(params.id, { includeScheduled: true });
	if (!challenge) error(404, 'Challenge not found');
	return { challenge };
};

export const actions = {
	default: async ({ request, cookies, params }) => {
		requireAdmin(cookies);
		const challenge = await getChallenge(params.id, { includeScheduled: true });
		if (!challenge) error(404, 'Challenge not found');

		const form = await request.formData();
		const f = await readChallengeForm(form, false);
		if (!f.ok) return fail(400, { values: f.values, errors: f.errors });

		const changes = {
			title: f.values.title,
			difficulty: f.difficulty,
			week: f.values.week,
			cadUrl: f.values.cadUrl,
			drawing: challenge.drawing,
			assemblyDrawing: challenge.assemblyDrawing
		};
		const stale: string[] = [];
		try {
			if (f.drawing) {
				changes.drawing = await saveDrawing(f.drawing, f.values.title);
				stale.push(challenge.drawing);
			}
			if (f.assemblyDrawing || form.get('removeAssembly')) {
				changes.assemblyDrawing = f.assemblyDrawing
					? await saveDrawing(f.assemblyDrawing, `${f.values.title} assembly`)
					: '';
				stale.push(challenge.assemblyDrawing);
			}
		} catch (e) {
			return fail(500, { values: f.values, errors: { drawing: `Couldn't save the drawing. ${(e as Error).message}` } });
		}
		await updateChallenge(challenge.id, changes);
		for (const path of stale) await removeDrawing(path);
		redirect(303, '/admin/challenges');
	}
} satisfies Actions;
