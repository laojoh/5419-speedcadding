<script lang="ts">
	import { formatTime } from '#lib/time.ts';
	import type { RankedEntry } from '#lib/server/db.ts';

	let { entries }: { entries: RankedEntry[] } = $props();
</script>

{#if entries.length === 0}
	<p class="muted">No times yet. <a href="/submit">Be the first</a>.</p>
{:else}
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th>#</th><th>Name</th><th>Team</th><th class="num">Time</th><th></th></tr>
			</thead>
			<tbody>
				{#each entries as e (e.rank)}
					<tr>
						<td class="mono muted">{e.rank}</td>
						<td>{e.name}</td>
						<td class="mono muted">{e.team || '—'}</td>
						<td class="num mono" class:first={e.rank === 1}>{formatTime(e.timeMs)}</td>
						<td class="num links">
							<a href={e.videoUrl} target="_blank" rel="noopener noreferrer">Video</a>
							{#if e.cadUrl}<a href={e.cadUrl} target="_blank" rel="noopener noreferrer">CAD</a>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.num {
		text-align: right;
	}

	.first {
		color: var(--primary-soft);
	}

	.links a {
		margin-left: 0.75rem;
		color: var(--fg-muted);
	}

	.links a:hover {
		color: var(--fg);
	}
</style>
