import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_DIR } from '$app/env/private';

const dir = join(DATA_DIR, 'uploads');
export const MAX_UPLOAD_MB = 20;

// SVG is left out on purpose: it can carry scripts.
const TYPES: Record<string, { ext: string; magic: number[] }> = {
	'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
	'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
	'image/webp': { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
	'application/pdf': { ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] }
};

const CONTENT_TYPES: Record<string, string> = Object.fromEntries(
	Object.entries(TYPES).map(([mime, { ext }]) => [ext, mime])
);

export const NAME_PATTERN = /^[a-f0-9-]{36}\.(png|jpg|webp|pdf)$/;

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

/** Saves an upload already passed through checkUpload and returns its stored file name. */
export async function saveUpload(file: File) {
	const type = TYPES[file.type];
	const bytes = new Uint8Array(await file.arrayBuffer());
	const name = `${crypto.randomUUID()}.${type.ext}`;
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, name), bytes);
	return name;
}

export async function readUpload(name: string) {
	if (!NAME_PATTERN.test(name)) return null;
	try {
		const body = await readFile(join(dir, name));
		return { body, type: CONTENT_TYPES[name.split('.').pop()!] };
	} catch {
		return null;
	}
}

export async function removeUpload(name: string) {
	if (!NAME_PATTERN.test(name)) return;
	await unlink(join(dir, name)).catch(() => {});
}
