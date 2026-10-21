import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Redis } from '@upstash/redis';
import {
	DATA_DIR,
	KV_REST_API_TOKEN,
	KV_REST_API_URL,
	UPSTASH_REDIS_REST_TOKEN,
	UPSTASH_REDIS_REST_URL
} from '$app/env/private';

export type Kind = 'challenges' | 'submissions';

/** Minimal record store: each kind is a collection of JSON objects keyed by id. */
interface Store {
	all<T>(kind: Kind): Promise<T[]>;
	put<T extends { id: string }>(kind: Kind, item: T): Promise<void>;
	remove(kind: Kind, ids: string[]): Promise<void>;
}

/** Upstash Redis: one hash per kind, field = id, value = the record as JSON. */
function redisStore(redis: Redis): Store {
	const key = (kind: Kind) => `speedcad:${kind}`;
	return {
		async all<T>(kind: Kind) {
			return Object.values((await redis.hgetall<Record<string, T>>(key(kind))) ?? {});
		},
		async put(kind, item) {
			await redis.hset(key(kind), { [item.id]: item });
		},
		async remove(kind, ids) {
			if (ids.length > 0) await redis.hdel(key(kind), ...ids);
		}
	};
}

/** Local JSON file, for development without Redis. */
function fileStore(dir: string): Store {
	type Data = Record<Kind, { id: string }[]>;
	const file = join(dir, 'db.json');

	async function load(): Promise<Data> {
		try {
			const data = JSON.parse(await readFile(file, 'utf8'));
			return { challenges: data.challenges ?? [], submissions: data.submissions ?? [] };
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { challenges: [], submissions: [] };
			throw e;
		}
	}

	// Serialize writes so two requests arriving at once don't overwrite each other.
	let queue: Promise<unknown> = Promise.resolve();
	function update(fn: (data: Data) => void) {
		const run = queue.then(async () => {
			const data = await load();
			fn(data);
			await mkdir(dir, { recursive: true });
			await writeFile(file + '.tmp', JSON.stringify(data, null, '\t'));
			await rename(file + '.tmp', file);
		});
		queue = run.catch(() => {});
		return run;
	}

	return {
		async all<T>(kind: Kind) {
			return (await load())[kind] as T[];
		},
		put: (kind, item) =>
			update((data) => {
				const i = data[kind].findIndex((x) => x.id === item.id);
				if (i === -1) data[kind].push(item);
				else data[kind][i] = item;
			}),
		remove: (kind, ids) =>
			update((data) => {
				data[kind] = data[kind].filter((x) => !ids.includes(x.id));
			})
	};
}

const url = KV_REST_API_URL ?? UPSTASH_REDIS_REST_URL;
const token = KV_REST_API_TOKEN ?? UPSTASH_REDIS_REST_TOKEN;

export const store: Store = url && token ? redisStore(new Redis({ url, token })) : fileStore(DATA_DIR);
