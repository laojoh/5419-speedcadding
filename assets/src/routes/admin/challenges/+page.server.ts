import { fail } from '@sveltejs/kit';
import { requireAdmin } from '#lib/server/auth.ts';
import { readChallengeForm, thisMonday } from '#lib/server/challengeForm.ts';
import { addChallenge, deleteChallenge, listChallenges, today } from '#lib/server/db.ts';
import { removeUpload, saveUpload } from '#lib/server/files.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	requireAdmin(cookies);
	return {
		challenges: await listChallenges({ includeScheduled: true }),
		today: today(),
		defaultWeek: thisMonday()
	};
};

export const actions = {
	create: async ({ request, cookies }) => {
		requireAdmin(cookies);
		const f = await readChallengeForm(await request.formData(), true);
		if (!f.ok) return fail(400, { values: f.values, errors: f.errors });

		await addChallenge({
			title: f.values.title,
			difficulty: f.difficulty,
			week: f.values.week,
			cadUrl: f.values.cadUrl,
			drawing: await saveUpload(f.drawing!),
			assemblyDrawing: f.assemblyDrawing ? await saveUpload(f.assemblyDrawing) : ''
		});
		return { created: f.values.title };
	},
	delete: async ({ request, cookies }) => {
		requireAdmin(cookies);
		const removed = await deleteChallenge(String((await request.formData()).get('id') ?? ''));
		if (removed) {
			await removeUpload(removed.drawing);
			await removeUpload(removed.assemblyDrawing);
		}
	}
} satisfies Actions;
