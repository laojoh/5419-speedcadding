import { error, fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '#lib/server/auth.ts';
import { readChallengeForm } from '#lib/server/challengeForm.ts';
import { getChallenge, updateChallenge } from '#lib/server/db.ts';
import { removeUpload, saveUpload } from '#lib/server/files.ts';
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
		if (f.drawing) {
			changes.drawing = await saveUpload(f.drawing);
			stale.push(challenge.drawing);
		}
		if (f.assemblyDrawing || form.get('removeAssembly')) {
			changes.assemblyDrawing = f.assemblyDrawing ? await saveUpload(f.assemblyDrawing) : '';
			stale.push(challenge.assemblyDrawing);
		}
		await updateChallenge(challenge.id, changes);
		await Promise.all(stale.map(removeUpload));
		redirect(303, '/admin/challenges');
	}
} satisfies Actions;
