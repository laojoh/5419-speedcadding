<script lang="ts">
	import ChallengeCard from '#lib/components/ChallengeCard.svelte';
	import { formatWeek } from '#lib/challenges.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="container page">
	<h1>This week</h1>
	{#if data.current}
		<p class="muted">Week of {formatWeek(data.current.week)}. Model the drawing, record your screen, submit your time.</p>
		<div class="grid">
			{#each data.current.challenges as { challenge, best } (challenge.id)}
				<ChallengeCard {challenge} {best} />
			{/each}
		</div>
	{:else}
		<p class="muted">No challenges posted yet. Check back soon.</p>
	{/if}

	{#if data.archiveCount > 0}
		<p class="more">
			<a href="/archive">{data.archiveCount} past {data.archiveCount === 1 ? 'challenge' : 'challenges'} in the archive →</a>
		</p>
	{/if}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
		gap: 1rem;
		margin-top: 1.75rem;
	}

	.more {
		margin-top: 2.5rem;
	}
</style>
