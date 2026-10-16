import { challengesByWeek, leaderboard, listSubmissions } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [{ archive }, submissions] = await Promise.all([challengesByWeek(), listSubmissions('approved')]);
	return {
		weeks: archive.map((w) => ({
			week: w.week,
			challenges: w.challenges.map((c) => ({ challenge: c, best: leaderboard(submissions, c.id)[0]?.timeMs ?? null }))
		}))
	};
};
