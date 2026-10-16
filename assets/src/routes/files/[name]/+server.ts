import { error } from '@sveltejs/kit';
import { readUpload } from '#lib/server/files.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const file = await readUpload(params.name);
	if (!file) error(404, 'Not found');
	return new Response(new Uint8Array(file.body), {
		headers: {
			'Content-Type': file.type,
			'Cache-Control': 'public, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
