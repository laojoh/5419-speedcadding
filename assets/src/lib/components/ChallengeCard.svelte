<script lang="ts">
	import { difficultyLabel, isPdf, type Challenge } from '#lib/challenges.ts';
	import { formatTime } from '#lib/time.ts';

	let { challenge: c, best }: { challenge: Challenge; best?: number | null } = $props();

	const thumb = $derived(c.drawings.find((d) => !isPdf(d)));
</script>

<a class="card" href="/challenges/{c.id}">
	<div class="thumb">
		{#if thumb}
			<img src={thumb} alt="" loading="lazy" />
		{:else}
			<span class="muted mono">PDF drawing</span>
		{/if}
		{#if c.drawings.length > 1}<span class="parts mono">{c.drawings.length} parts</span>{/if}
	</div>
	<div class="meta">
		<span class="level {c.difficulty}">{difficultyLabel(c.difficulty)}</span>
		<span class="title">{c.title}</span>
		{#if best !== undefined}
			<span class="best mono muted">{best ? formatTime(best) : '—'}</span>
		{/if}
	</div>
</a>

<style>
	.card {
		display: block;
		text-decoration: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
		transition: border-color 0.15s;
	}

	.card:hover {
		border-color: var(--fg-muted);
	}

	.thumb {
		position: relative;
		aspect-ratio: 4 / 3;
		background: #fff;
		display: grid;
		place-items: center;
		border-bottom: 1px solid var(--border);
	}

	.thumb .muted {
		color: #666;
		font-size: 0.8rem;
	}

	.parts {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--bg);
		color: var(--fg);
		font-size: 0.7rem;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 0.5rem;
	}

	.meta {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.75rem 0.9rem;
	}

	.title {
		font-weight: 600;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.best {
		font-size: 0.85rem;
	}
</style>
