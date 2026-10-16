<script lang="ts">
	import ChallengeCard from '#lib/components/ChallengeCard.svelte';
	import { formatWeek } from '#lib/challenges.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Archive · 5419 Speedcadding</title></svelte:head>

<div class="container page">
	<h1>Archive</h1>
	<p class="muted">Past weeks are still open. Submit a run any time to beat the record.</p>

	{#each data.weeks as w (w.week)}
		<h2>Week of {formatWeek(w.week)}</h2>
		<div class="grid">
			{#each w.challenges as { challenge, best } (challenge.id)}
				<ChallengeCard {challenge} {best} />
			{/each}
		</div>
	{:else}
		<p class="muted">Nothing here yet. Past weeks show up here once a new week starts.</p>
	{/each}
</div>

<style>
	h2 {
		margin-top: 2.75rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
</style>
