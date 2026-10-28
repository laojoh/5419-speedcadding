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
		const f = await readChallengeForm(form, challenge.drawings);
		if (!f.ok) return fail(400, { values: f.values, errors: f.errors });

		const added: string[] = [];
		let assemblyDrawing = challenge.assemblyDrawing;
		const stale = [...f.removedDrawings];
		try {
			const first = f.keptDrawings.length;
			for (const [i, file] of f.newDrawings.entries()) {
				added.push(await saveDrawing(file, `${f.values.title} part ${first + i + 1}`));
			}
			if (f.assemblyDrawing || form.get('removeAssembly')) {
				assemblyDrawing = f.assemblyDrawing ? await saveDrawing(f.assemblyDrawing, `${f.values.title} assembly`) : '';
				stale.push(challenge.assemblyDrawing);
			}
		} catch (e) {
			for (const path of added) await removeDrawing(path);
			return fail(500, { values: f.values, errors: { drawings: `Couldn't save the drawings. ${(e as Error).message}` } });
		}
		const changes = {
			title: f.values.title,
			difficulty: f.difficulty,
			week: f.values.week,
			cadUrl: f.values.cadUrl,
			description: f.values.description,
			drawings: [...f.keptDrawings, ...added],
			assemblyDrawing
		};
		await updateChallenge(challenge.id, changes);
		for (const path of stale) if (path) await removeDrawing(path);
		redirect(303, '/admin/challenges');
	}
} satisfies Actions;
