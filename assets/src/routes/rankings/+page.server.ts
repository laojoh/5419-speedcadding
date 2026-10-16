import { DIFFICULTIES } from '#lib/challenges.ts';
import { duringWeek, leaderboard, listChallenges, listSubmissions, weekEnd } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [challenges, submissions] = await Promise.all([listChallenges(), listSubmissions('approved')]);
	const boards = await Promise.all(
		challenges.map(async (c) => ({
			challenge: c,
			// Top 3 only counts runs from the challenge's week; all-time best counts everything.
			top: leaderboard(submissions, c.id, duringWeek(await weekEnd(c))).slice(0, 3),
			allTime: leaderboard(submissions, c.id)[0] ?? null
		}))
	);
	return {
		// listChallenges is newest week first
		categories: DIFFICULTIES.map((d) => ({ ...d, challenges: boards.filter((b) => b.challenge.difficulty === d.id) }))
	};
};
