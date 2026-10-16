<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatTime } from '#lib/time.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	/** YouTube links get an inline player so reviewers don't have to leave the page. */
	function youtubeId(url: string) {
		try {
			const u = new URL(url);
			if (u.hostname === 'youtu.be') return u.pathname.slice(1);
			if (u.hostname.endsWith('youtube.com')) {
				return u.searchParams.get('v') ?? u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1] ?? null;
			}
		} catch {}
		return null;
	}

	const when = (iso: string) => new Date(iso).toLocaleString();
	const title = (id: string) => data.titles[id]?.title ?? 'Deleted challenge';
</script>

{#if !data.configured}
	<h1>Admin</h1>
	<p class="muted">
		Admin is off. Set <code>ADMIN_PASSWORD</code> in <code>.env</code> (see <code>.env.example</code>) and restart the server.
	</p>
{:else if !data.authed}
	<h1>Admin</h1>
	<form method="POST" action="?/login" class="login" use:enhance>
		<label for="password">Password</label>
		<input id="password" name="password" type="password" autocomplete="current-password" required />
		{#if form && 'loginError' in form}<p class="error">{form.loginError}</p>{/if}
		<button class="btn">Log in</button>
	</form>
{:else}
	<h2>Pending <span class="muted">{data.pending.length}</span></h2>
	{#if data.pending.length === 0}
		<p class="muted">Nothing to review.</p>
	{/if}
	<div class="list">
		{#each data.pending as s (s.id)}
			{@const yt = youtubeId(s.videoUrl)}
			<div class="item">
				<div class="info">
					<div class="muted">{title(s.challengeId)}</div>
					<div class="big mono">{formatTime(s.timeMs)}</div>
					<div>{s.name} {#if s.team}<span class="muted mono">{s.team}</span>{/if}</div>
					<div class="muted small">{when(s.submittedAt)}</div>
					<div class="links">
						<a href={s.videoUrl} target="_blank" rel="noopener noreferrer">Video ↗</a>
						{#if s.cadUrl}<a href={s.cadUrl} target="_blank" rel="noopener noreferrer">CAD ↗</a>{/if}
					</div>
					{#if s.notes}<p class="notes">“{s.notes}”</p>{/if}
					<div class="actions">
						<form method="POST" action="?/approve" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button class="btn small">Approve</button>
						</form>
						<form method="POST" action="?/reject" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button class="btn ghost small">Reject</button>
						</form>
					</div>
				</div>
				{#if yt}
					<iframe
						src="https://www.youtube-nocookie.com/embed/{yt}"
						title="Run video from {s.name}"
						allow="encrypted-media; picture-in-picture; fullscreen"
						loading="lazy"
					></iframe>
				{/if}
			</div>
		{/each}
	</div>

	<h2 class="reviewed-head">Reviewed</h2>
	{#if data.reviewed.length === 0}
		<p class="muted">No reviewed runs yet.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead><tr><th>Status</th><th>Name</th><th>Challenge</th><th>Time</th><th></th></tr></thead>
				<tbody>
					{#each data.reviewed as s (s.id)}
						<tr>
							<td><span class="status {s.status}">{s.status}</span></td>
							<td>{s.name} <span class="muted mono">{s.team}</span></td>
							<td>{title(s.challengeId)}</td>
							<td class="time"><a href={s.videoUrl} target="_blank" rel="noopener noreferrer">{formatTime(s.timeMs)}</a></td>
							<td class="row-actions">
								<form method="POST" action={s.status === 'approved' ? '?/reject' : '?/approve'} use:enhance>
									<input type="hidden" name="id" value={s.id} />
									<button class="link">{s.status === 'approved' ? 'Unapprove' : 'Approve'}</button>
								</form>
								<form
									method="POST"
									action="?/delete"
									use:enhance={({ cancel }) => {
										if (!confirm(`Delete ${s.name}'s run? This can't be undone.`)) cancel();
									}}
								>
									<input type="hidden" name="id" value={s.id} />
									<button class="link">Delete</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{/if}

<style>
	.login {
		max-width: 320px;
		display: grid;
		gap: 0.6rem;
		margin-top: 1.5rem;
	}

	.login button {
		justify-self: start;
	}

	.list {
		display: grid;
	}

	.item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
		gap: 1.5rem;
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--border);
	}

	.item:not(:has(iframe)) {
		grid-template-columns: minmax(0, 1fr);
	}

	@media (max-width: 760px) {
		.item {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.big {
		font-size: 1.75rem;
		font-weight: 600;
	}

	.small {
		font-size: 0.8rem;
	}

	.links {
		display: flex;
		gap: 1rem;
	}

	.notes {
		margin: 0.25rem 0;
		color: var(--fg-muted);
	}

	.actions,
	.row-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.row-actions {
		margin: 0;
		justify-content: flex-end;
	}

	iframe {
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 0;
		border-radius: 4px;
		background: #000;
	}

	.reviewed-head {
		margin-top: 3rem;
	}

	.status {
		font-size: 0.8rem;
	}

	.status.approved {
		color: var(--fg);
	}

	.status.rejected {
		color: var(--fg-muted);
	}
</style>
