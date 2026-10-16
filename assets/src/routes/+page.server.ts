import { challengesByWeek, leaderboard, listSubmissions } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [{ current, archive }, submissions] = await Promise.all([challengesByWeek(), listSubmissions('approved')]);
	return {
		current: current && {
			week: current.week,
			challenges: current.challenges.map((c) => ({ challenge: c, best: leaderboard(submissions, c.id)[0]?.timeMs ?? null }))
		},
		archiveCount: archive.reduce((n, w) => n + w.challenges.length, 0)
	};
};
