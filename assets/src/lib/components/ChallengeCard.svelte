<script lang="ts">
	import { difficultyLabel, fileUrl, isPdf, type Challenge } from '#lib/challenges.ts';
	import { formatTime } from '#lib/time.ts';

	let { challenge: c, best }: { challenge: Challenge; best?: number | null } = $props();
</script>

<a class="card" href="/challenges/{c.id}">
	<div class="thumb">
		{#if isPdf(c.drawing)}
			<span class="muted mono">PDF drawing</span>
		{:else}
			<img src={fileUrl(c.drawing)} alt="" loading="lazy" />
		{/if}
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
