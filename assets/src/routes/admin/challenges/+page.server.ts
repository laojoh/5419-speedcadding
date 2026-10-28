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
		const f = await readChallengeForm(await request.formData());
		if (!f.ok) return fail(400, { values: f.values, errors: f.errors });

		const drawings: string[] = [];
		let assemblyDrawing = '';
		try {
			for (const [i, file] of f.newDrawings.entries()) {
				drawings.push(await saveDrawing(file, f.newDrawings.length > 1 ? `${f.values.title} part ${i + 1}` : f.values.title));
			}
			if (f.assemblyDrawing) assemblyDrawing = await saveDrawing(f.assemblyDrawing, `${f.values.title} assembly`);
		} catch (e) {
			// Don't leave half an upload behind
			for (const path of drawings) await removeDrawing(path);
			return fail(500, { values: f.values, errors: { drawings: `Couldn't save the drawings. ${(e as Error).message}` } });
		}

		await addChallenge({
			title: f.values.title,
			difficulty: f.difficulty,
			week: f.values.week,
			cadUrl: f.values.cadUrl,
			description: f.values.description,
			drawings,
			assemblyDrawing
		});
		return { created: f.values.title, redeploying: commitsToGitHub };
	},
	delete: async ({ request, cookies }) => {
		requireAdmin(cookies);
		const removed = await deleteChallenge(String((await request.formData()).get('id') ?? ''));
		if (removed) {
			for (const path of [...removed.drawings, removed.assemblyDrawing]) await removeDrawing(path);
		}
	}
} satisfies Actions;
