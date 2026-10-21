import { fail } from '@sveltejs/kit';
import { requireAdmin } from '#lib/server/auth.ts';
import { readChallengeForm, thisMonday } from '#lib/server/challengeForm.ts';
import { addChallenge, deleteChallenge, listChallenges, today } from '#lib/server/db.ts';
import { commitsToGitHub, removeDrawing, saveDrawing } from '#lib/server/files.ts';
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

		let drawing: string, assemblyDrawing: string;
		try {
			drawing = await saveDrawing(f.drawing!, f.values.title);
			assemblyDrawing = f.assemblyDrawing ? await saveDrawing(f.assemblyDrawing, `${f.values.title} assembly`) : '';
		} catch (e) {
			return fail(500, { values: f.values, errors: { drawing: `Couldn't save the drawing. ${(e as Error).message}` } });
		}

		await addChallenge({
			title: f.values.title,
			difficulty: f.difficulty,
			week: f.values.week,
			cadUrl: f.values.cadUrl,
			drawing,
			assemblyDrawing
		});
		return { created: f.values.title, redeploying: commitsToGitHub };
	},
	delete: async ({ request, cookies }) => {
		requireAdmin(cookies);
		const removed = await deleteChallenge(String((await request.formData()).get('id') ?? ''));
		if (removed) {
			await removeDrawing(removed.drawing);
			await removeDrawing(removed.assemblyDrawing);
		}
	}
} satisfies Actions;
