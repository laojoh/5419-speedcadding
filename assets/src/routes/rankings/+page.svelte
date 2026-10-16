<script lang="ts">
	import { formatWeek } from '#lib/challenges.ts';
	import { formatTime } from '#lib/time.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Rankings · 5419 Speedcadding</title></svelte:head>

<div class="container page">
	<h1>Rankings</h1>
	<p class="muted">Top 3 for every challenge. Click one for the full leaderboard.</p>

	{#each data.categories as cat (cat.id)}
		<section>
			<h2><span class="level {cat.id}">{cat.label}</span></h2>
			{#if cat.challenges.length === 0}
				<p class="muted">No {cat.label.toLowerCase()} challenges yet.</p>
			{:else}
				<div class="grid">
					{#each cat.challenges as { challenge: c, top } (c.id)}
						<a class="board" href="/challenges/{c.id}#leaderboard">
							<div class="board-head">
								<span class="title">{c.title}</span>
								<span class="muted week">{formatWeek(c.week)}</span>
							</div>
							<ol>
								{#each [0, 1, 2] as i}
									{@const e = top[i]}
									<li class:first={i === 0}>
										<span class="place mono muted">{i + 1}</span>
										{#if e}
											<span class="who">
												{e.name}
												{#if e.team}<span class="muted mono team">{e.team}</span>{/if}
											</span>
											<span class="time mono">{formatTime(e.timeMs)}</span>
										{:else}
											<span class="who muted">—</span>
										{/if}
									</li>
								{/each}
							</ol>
							<span class="full muted">Full leaderboard →</span>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</div>

<style>
	section {
		margin-top: 2.5rem;
	}

	h2 .level {
		font-size: 0.85rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.board {
		display: block;
		text-decoration: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.9rem 1rem 0.75rem;
		transition: border-color 0.15s;
	}

	.board:hover {
		border-color: var(--fg-muted);
	}

	.board:hover .full {
		color: var(--fg);
	}

	.full {
		display: block;
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}

	.board-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.4rem;
	}

	.title {
		font-weight: 600;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.week {
		font-size: 0.8rem;
		white-space: nowrap;
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.45rem 0;
		border-top: 1px solid var(--border);
		font-size: 0.95rem;
	}

	.place {
		width: 1ch;
	}

	.who {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.team {
		font-size: 0.8rem;
		margin-left: 0.3rem;
	}

	li.first .time {
		color: var(--primary-soft);
	}
</style>
