<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(form && 'values' in form ? form.values : undefined);
	const errors = $derived(form && 'errors' in form ? form.errors : undefined);
	const selected = $derived(values?.challengeId ?? page.url.searchParams.get('challenge') ?? '');
	let submitting = $state(false);
</script>

<svelte:head><title>Submit · 5419 Speedcadding</title></svelte:head>

<div class="container page narrow">
	<h1>Submit a time</h1>

	{#if form && 'success' in form}
		<p>Thanks! Your run for <strong>{form.challengeTitle}</strong> will show up once it’s reviewed.</p>
		<p class="row">
			<a class="btn" href="/submit">Submit another</a>
			<a class="btn ghost" href="/challenges/{form.challengeId}">Back to challenge</a>
		</p>
	{:else if data.groups.length === 0}
		<p class="muted">No challenges are open yet.</p>
	{:else}
		<p class="muted">
			Upload your screen recording to YouTube (unlisted is fine) or Google Drive (anyone with the link), then paste
			the link here. The whole run has to be on video.
		</p>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<div>
				<label for="challengeId">Challenge</label>
				<select id="challengeId" name="challengeId" required value={selected}>
					<option value="" disabled>Choose…</option>
					{#each data.groups as g}
						<optgroup label={g.label}>
							{#each g.options as o}
								<option value={o.id}>{o.label}</option>
							{/each}
						</optgroup>
					{/each}
				</select>
				{#if errors?.challengeId}<p class="error">{errors.challengeId}</p>{/if}
			</div>

			<div class="two">
				<div>
					<label for="name">Name</label>
					<input id="name" name="name" autocomplete="name" required maxlength="60" value={values?.name ?? ''} />
					{#if errors?.name}<p class="error">{errors.name}</p>{/if}
				</div>
				<div>
					<label for="team">Team <span class="muted">(optional)</span></label>
					<input id="team" name="team" inputmode="numeric" placeholder="5419" value={values?.team ?? ''} />
					{#if errors?.team}<p class="error">{errors.team}</p>{/if}
				</div>
			</div>

			<div>
				<label for="time">Time</label>
				<input id="time" name="time" class="mono" placeholder="m:ss.cc" required value={values?.time ?? ''} />
				{#if errors?.time}<p class="error">{errors.time}</p>{/if}
			</div>

			<div>
				<label for="videoUrl">Video link</label>
				<input id="videoUrl" name="videoUrl" type="url" placeholder="https://youtu.be/…" required value={values?.videoUrl ?? ''} />
				{#if errors?.videoUrl}<p class="error">{errors.videoUrl}</p>{/if}
			</div>

			<div>
				<label for="cadUrl">Your CAD link <span class="muted">(optional)</span></label>
				<input id="cadUrl" name="cadUrl" type="url" placeholder="https://cad.onshape.com/documents/…" value={values?.cadUrl ?? ''} />
				{#if errors?.cadUrl}<p class="error">{errors.cadUrl}</p>{/if}
			</div>

			<div>
				<label for="notes">Notes <span class="muted">(optional)</span></label>
				<textarea id="notes" name="notes" rows="2" maxlength="500">{values?.notes ?? ''}</textarea>
				{#if errors?.notes}<p class="error">{errors.notes}</p>{/if}
			</div>

			<button class="btn" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</button>
		</form>
	{/if}
</div>

<style>
	.narrow {
		max-width: 560px;
	}

	form {
		display: grid;
		gap: 1.1rem;
		margin-top: 1.75rem;
	}

	.two {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: 1rem;
	}

	@media (max-width: 480px) {
		.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	button {
		justify-self: start;
	}

	button:disabled {
		opacity: 0.6;
	}
</style>
