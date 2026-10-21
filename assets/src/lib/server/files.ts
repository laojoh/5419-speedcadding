import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GITHUB_BRANCH, GITHUB_REPO, GITHUB_TOKEN } from '$app/env/private';

/**
 * Drawings live in static/images and are served at /images/<name>.
 * With GITHUB_TOKEN set (Vercel), uploads are committed to the repo and show up once Vercel
 * redeploys. Without it (local dev), they're written straight to the folder.
 */
const FOLDER = 'static/images';
const REPO_FOLDER = `assets/${FOLDER}`;

/** Vercel rejects request bodies over 4.5 MB, so keep uploads under that. */
export const MAX_UPLOAD_MB = 4;

export const commitsToGitHub = !!GITHUB_TOKEN;

// SVG is left out on purpose: it can carry scripts.
const TYPES: Record<string, { ext: string; magic: number[] }> = {
	'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
	'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
	'image/webp': { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
	'application/pdf': { ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] }
};

const PATH_PATTERN = /^\/images\/([a-z0-9-]+\.(png|jpg|webp|pdf))$/;

/** Returns an error message, or null if the file is an acceptable drawing. */
export async function checkUpload(file: File | null): Promise<string | null> {
	if (!file || file.size === 0) return null;
	const type = TYPES[file.type];
	if (!type) return 'Use a PNG, JPG, WebP or PDF.';
	if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `Keep files under ${MAX_UPLOAD_MB} MB.`;
	const head = new Uint8Array(await file.slice(0, type.magic.length).arrayBuffer());
	if (!type.magic.every((b, i) => head[i] === b)) return 'That file looks damaged or isn’t really a ' + type.ext.toUpperCase() + '.';
	return null;
}

async function github(path: string, init: RequestInit = {}) {
	const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': '5419-speedcadding'
		}
	});
	if (!res.ok && res.status !== 404) {
		const { message } = await res.json().catch(() => ({ message: res.statusText }));
		throw new Error(`GitHub said ${res.status}: ${message}`);
	}
	return res;
}

/** Saves a drawing already passed through checkUpload. Returns its public path, e.g. /images/gusset-1a2b3c.png */
export async function saveDrawing(file: File, title: string) {
	const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'drawing';
	const name = `${slug}-${crypto.randomUUID().slice(0, 6)}.${TYPES[file.type].ext}`;
	const bytes = new Uint8Array(await file.arrayBuffer());

	if (commitsToGitHub) {
		await github(`${REPO_FOLDER}/${name}`, {
			method: 'PUT',
			body: JSON.stringify({
				message: `Add drawing ${name}`,
				content: Buffer.from(bytes).toString('base64'),
				branch: GITHUB_BRANCH
			})
		});
	} else {
		await mkdir(FOLDER, { recursive: true });
		await writeFile(join(FOLDER, name), bytes);
	}
	return `/images/${name}`;
}

/** Removes a drawing saved by saveDrawing. Never throws: a leftover file is harmless. */
export async function removeDrawing(path: string) {
	const name = path.match(PATH_PATTERN)?.[1];
	if (!name) return;
	try {
		if (commitsToGitHub) {
			const file = `${REPO_FOLDER}/${name}`;
			const res = await github(`${file}?ref=${GITHUB_BRANCH}`);
			if (res.status === 404) return;
			const { sha } = await res.json();
			await github(file, {
				method: 'DELETE',
				body: JSON.stringify({ message: `Remove drawing ${name}`, sha, branch: GITHUB_BRANCH })
			});
		} else {
			await unlink(join(FOLDER, name));
		}
	} catch (e) {
		console.warn(`Couldn't remove drawing ${name}:`, e);
	}
}
