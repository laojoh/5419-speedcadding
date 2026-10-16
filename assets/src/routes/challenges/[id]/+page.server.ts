import { error } from '@sveltejs/kit';
import { challengesByWeek, duringWeek, getChallenge, leaderboard, listSubmissions, weekEnd } from '#lib/server/db.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const challenge = await getChallenge(params.id);
	if (!challenge) error(404, 'Challenge not found');
	const [{ current }, submissions, end] = await Promise.all([
		challengesByWeek(),
		listSubmissions('approved'),
		weekEnd(challenge)
	]);
	const inWeek = duringWeek(end);
	return {
		challenge,
		archived: current?.week !== challenge.week,
		weekEnd: end,
		during: leaderboard(submissions, challenge.id, inWeek),
		after: leaderboard(submissions, challenge.id, (s) => !inWeek(s))
	};
};
