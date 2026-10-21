import { fail } from '@sveltejs/kit';
import { isAdmin, logIn, logOut, requireAdmin } from '#lib/server/auth.ts';
import { deleteSubmission, listChallenges, listSubmissions, setStatus } from '#lib/server/db.ts';
import { parseTime } from '#lib/time.ts';
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
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		// Official time from the timing tool; blank keeps the runner's own time.
		const time = String(form.get('time') ?? '').trim();
		const timeMs = time ? parseTime(time) : undefined;
		if (timeMs === null) return fail(400, { id, timeError: 'Use a time like 1:29.04' });
		await setStatus(id, 'approved', timeMs);
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
