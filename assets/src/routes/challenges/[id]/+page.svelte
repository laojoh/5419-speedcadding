<script lang="ts">
	import Leaderboard from '#lib/components/Leaderboard.svelte';
	import { addDays, difficultyLabel, formatWeek, isPdf, labelledDrawings } from '#lib/challenges.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const c = $derived(data.challenge);
	const drawings = $derived(labelledDrawings(c));
	const lastDay = $derived(addDays(data.weekEnd, -1));
</script>

<svelte:head><title>{c.title} · 5419 Speedcadding</title></svelte:head>

<div class="container page">
	<a class="back muted" href={data.archived ? '/archive' : '/'}>← {data.archived ? 'Archive' : 'This week'}</a>

	<div class="head">
		<div>
			<p class="muted sub">
				<span class="level {c.difficulty}">{difficultyLabel(c.difficulty)}</span> · Week of {formatWeek(c.week)}
			</p>
			<h1>{c.title}</h1>
			{#if c.description}<p class="description">{c.description}</p>{/if}
		</div>
		<div class="actions">
			{#if c.cadUrl}
				<a class="btn ghost" href={c.cadUrl} target="_blank" rel="noopener noreferrer">CAD ↗</a>
			{/if}
			<a class="btn" href="/submit?challenge={c.id}">Submit a time</a>
		</div>
	</div>

	{#each drawings as d (d.file)}
		<figure>
			{#if isPdf(d.file)}
				<object data={d.file} type="application/pdf" title={d.label}>
					<a href={d.file} target="_blank" rel="noopener noreferrer">Open {d.label.toLowerCase()} (PDF)</a>
				</object>
			{:else}
				<a href={d.file} target="_blank" rel="noopener noreferrer">
					<img src={d.file} alt="{d.label} for {c.title}" />
				</a>
			{/if}
			{#if drawings.length > 1}<figcaption class="muted">{d.label}</figcaption>{/if}
		</figure>
	{/each}

	<section id="leaderboard">
		<h2>During the week</h2>
		<p class="muted note">Runs submitted {formatWeek(c.week)} – {formatWeek(lastDay)}.</p>
		<Leaderboard entries={data.during} />
	</section>

	{#if data.archived || data.after.length > 0}
		<section>
			<h2>After the week</h2>
			<p class="muted note">Runs submitted since the week ended. You can still try.</p>
			<Leaderboard entries={data.after} />
		</section>
	{/if}
</div>

<style>
	.back {
		text-decoration: none;
		font-size: 0.9rem;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
		margin: 1.25rem 0 1.5rem;
	}

	.head h1 {
		margin: 0;
	}

	.description {
		margin: 0.6rem 0 0;
		max-width: 640px;
		color: var(--fg-muted);
		white-space: pre-line;
	}

	.sub {
		margin: 0 0 0.35rem;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	figure {
		margin: 0 0 1.5rem;
	}

	img,
	object {
		display: block;
		width: 100%;
		background: #fff;
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	/* Fixed box so the page doesn't shift (and #leaderboard links land correctly) while the drawing loads */
	img {
		aspect-ratio: 4 / 3;
		max-height: 75vh;
		object-fit: contain;
	}

	object {
		height: 80vh;
	}

	figcaption {
		font-size: 0.85rem;
		margin-top: 0.4rem;
	}

	section {
		margin-top: 2.5rem;
		scroll-margin-top: 1rem;
	}

	h2 {
		margin-bottom: 0.2rem;
	}

	.note {
		font-size: 0.85rem;
		margin: 0 0 0.75rem;
	}
</style>
