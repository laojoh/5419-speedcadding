import { DIFFICULTIES } from '#lib/challenges.ts';
import { leaderboard, listChallenges, listSubmissions } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [challenges, submissions] = await Promise.all([listChallenges(), listSubmissions('approved')]);
	return {
		categories: DIFFICULTIES.map((d) => ({
			...d,
			// listChallenges is newest week first
			challenges: challenges
				.filter((c) => c.difficulty === d.id)
				.map((c) => ({ challenge: c, top: leaderboard(submissions, c.id).slice(0, 3) }))
		}))
	};
};
