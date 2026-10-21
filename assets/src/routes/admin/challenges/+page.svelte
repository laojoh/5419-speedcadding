<script lang="ts">
	import { enhance } from '$app/forms';
	import ChallengeForm from '#lib/components/ChallengeForm.svelte';
	import { difficultyLabel, formatWeek } from '#lib/challenges.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(form && 'values' in form ? form.values : undefined);
</script>

<h2>New challenge</h2>
{#if form && 'created' in form}
	<p class="saved">
		Added “{form.created}”.{#if form.redeploying}
			The drawing was committed to GitHub and will show up once Vercel redeploys (about a minute).{/if}
	</p>
{/if}
<ChallengeForm
	action="?/create"
	submitLabel="Add challenge"
	defaults={values ?? { title: '', difficulty: 'easy', week: data.defaultWeek, cadUrl: '' }}
	errors={form && 'errors' in form ? form.errors : undefined}
/>

<h2 class="all">All challenges</h2>
{#if data.challenges.length === 0}
	<p class="muted">None yet.</p>
{:else}
	<div class="table-wrap">
		<table>
			<thead><tr><th>Week of</th><th>Name</th><th>Level</th><th></th></tr></thead>
			<tbody>
				{#each data.challenges as c (c.id)}
					<tr>
						<td class="mono">
							{formatWeek(c.week)}
							{#if c.week > data.today}<span class="muted"> · scheduled</span>{/if}
						</td>
						<td>{c.title}</td>
						<td class="muted">{difficultyLabel(c.difficulty)}</td>
						<td class="row-actions">
							<a href="/admin/challenges/{c.id}">Edit</a>
							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									if (!confirm(`Delete “${c.title}” and all its runs? This can't be undone.`)) cancel();
								}}
							>
								<input type="hidden" name="id" value={c.id} />
								<button class="link">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	h2 {
		margin-bottom: 1.25rem;
	}

	.all {
		margin-top: 3.5rem;
	}

	.saved {
		color: var(--fg-muted);
	}

	.row-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}
</style>
