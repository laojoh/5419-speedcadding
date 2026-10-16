import { fail } from '@sveltejs/kit';
import { isAdmin, logIn, logOut, requireAdmin } from '#lib/server/auth.ts';
import { deleteSubmission, listChallenges, listSubmissions, setStatus } from '#lib/server/db.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	if (!isAdmin(cookies)) return { pending: [], reviewed: [], titles: {} };
	const all = await listSubmissions();
	const newest = (a: { submittedAt: string }, b: { submittedAt: string }) => b.submittedAt.localeCompare(a.submittedAt);
	const challenges = await listChallenges({ includeScheduled: true });
	return {
		pending: all.filter((s) => s.status === 'pending').sort(newest),
		reviewed: all.filter((s) => s.status !== 'pending').sort(newest),
		titles: Object.fromEntries(challenges.map((c) => [c.id, c]))
	};
};

async function idFrom(request: Request) {
	return String((await request.formData()).get('id') ?? '');
}

export const actions = {
	login: async ({ request, cookies }) => {
		const password = String((await request.formData()).get('password') ?? '');
		if (!logIn(cookies, password)) return fail(401, { loginError: 'Wrong password.' });
	},
	logout: async ({ cookies }) => {
		logOut(cookies);
	},
	approve: async ({ request, cookies }) => {
		requireAdmin(cookies);
		await setStatus(await idFrom(request), 'approved');
	},
	reject: async ({ request, cookies }) => {
		requireAdmin(cookies);
		await setStatus(await idFrom(request), 'rejected');
	},
	delete: async ({ request, cookies }) => {
		requireAdmin(cookies);
		await deleteSubmission(await idFrom(request));
	}
} satisfies Actions;
