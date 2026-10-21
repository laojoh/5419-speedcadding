import { fail } from '@sveltejs/kit';
import { formatWeek } from '#lib/challenges.ts';
import { isUrl } from '#lib/server/challengeForm.ts';
import { addSubmission, challengesByWeek, getChallenge } from '#lib/server/db.ts';
import { parseTime } from '#lib/time.ts';
import { youtubeId } from '#lib/youtube.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { current, archive } = await challengesByWeek();
	const options = (cs: { id: string; title: string; difficulty: string }[]) =>
		cs.map((c) => ({ id: c.id, label: `${c.title} (${c.difficulty})` }));
	return {
		groups: [
			...(current ? [{ label: 'This week', options: options(current.challenges) }] : []),
			...archive.map((w) => ({ label: `Week of ${formatWeek(w.week)}`, options: options(w.challenges) }))
		]
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const values = {
			name: String(form.get('name') ?? '').trim(),
			team: String(form.get('team') ?? '').trim(),
			challengeId: String(form.get('challengeId') ?? ''),
			time: String(form.get('time') ?? '').trim(),
			videoUrl: String(form.get('videoUrl') ?? '').trim(),
			cadUrl: String(form.get('cadUrl') ?? '').trim(),
			notes: String(form.get('notes') ?? '').trim()
		};

		const errors: Partial<Record<keyof typeof values, string>> = {};
		if (!values.name) errors.name = 'Enter your name.';
		else if (values.name.length > 60) errors.name = 'Keep it under 60 characters.';
		if (values.team && !/^\d{1,5}$/.test(values.team)) errors.team = 'Digits only.';
		const challenge = await getChallenge(values.challengeId);
		if (!challenge) errors.challengeId = 'Pick a challenge.';
		const timeMs = parseTime(values.time);
		if (timeMs === null) errors.time = 'Use a time like 4:32.10';
		if (!youtubeId(values.videoUrl)) errors.videoUrl = 'Paste a YouTube link, like https://youtu.be/…';
		if (values.cadUrl && !isUrl(values.cadUrl)) errors.cadUrl = 'That doesn’t look like a link.';
		if (values.notes.length > 500) errors.notes = 'Keep notes under 500 characters.';

		if (Object.keys(errors).length > 0) return fail(400, { values, errors });

		await addSubmission({
			name: values.name,
			team: values.team,
			challengeId: values.challengeId,
			timeMs: timeMs!,
			videoUrl: values.videoUrl,
			cadUrl: values.cadUrl,
			notes: values.notes
		});
		return { success: true, challengeId: challenge!.id, challengeTitle: challenge!.title };
	}
} satisfies Actions;
