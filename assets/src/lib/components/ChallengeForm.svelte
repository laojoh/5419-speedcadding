<script lang="ts">
	import { enhance } from '$app/forms';
	import { DIFFICULTIES, fileUrl, type Challenge } from '#lib/challenges.ts';

	interface Props {
		action: string;
		submitLabel: string;
		defaults: { title: string; difficulty: string; week: string; cadUrl: string };
		/** Set when editing, to show the current files. */
		existing?: Challenge;
		errors?: Partial<Record<string, string>>;
	}

	let { action, submitLabel, defaults, existing, errors }: Props = $props();
	let saving = $state(false);
</script>

<form
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: !existing });
			saving = false;
		};
	}}
>
	<div class="row">
		<div class="grow">
			<label for="title">Name</label>
			<input id="title" name="title" required maxlength="60" placeholder="Bearing Block" value={defaults.title} />
			{#if errors?.title}<p class="error">{errors.title}</p>{/if}
		</div>
		<div>
			<label for="difficulty">Difficulty</label>
			<select id="difficulty" name="difficulty" required value={defaults.difficulty}>
				{#each DIFFICULTIES as d}
					<option value={d.id}>{d.label}</option>
				{/each}
			</select>
			{#if errors?.difficulty}<p class="error">{errors.difficulty}</p>{/if}
		</div>
		<div>
			<label for="week">Week of</label>
			<input id="week" name="week" type="date" required value={defaults.week} />
			{#if errors?.week}<p class="error">{errors.week}</p>{/if}
		</div>
	</div>

	<div>
		<label for="drawing">Technical drawing</label>
		{#if existing}
			<p class="current">
				Current: <a href={fileUrl(existing.drawing)} target="_blank" rel="noopener noreferrer">view</a> · choose a file to replace it
			</p>
		{/if}
		<input id="drawing" name="drawing" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required={!existing} />
		{#if errors?.drawing}<p class="error">{errors.drawing}</p>{/if}
	</div>

	<div>
		<label for="assemblyDrawing">Assembly drawing <span class="muted">(optional)</span></label>
		{#if existing?.assemblyDrawing}
			<p class="current">
				Current: <a href={fileUrl(existing.assemblyDrawing)} target="_blank" rel="noopener noreferrer">view</a>
				<label class="inline"><input type="checkbox" name="removeAssembly" /> remove</label>
			</p>
		{/if}
		<input id="assemblyDrawing" name="assemblyDrawing" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
		{#if errors?.assemblyDrawing}<p class="error">{errors.assemblyDrawing}</p>{/if}
	</div>

	<div>
		<label for="cadUrl">CAD link <span class="muted">(optional)</span></label>
		<input id="cadUrl" name="cadUrl" type="url" placeholder="https://cad.onshape.com/documents/…" value={defaults.cadUrl} />
		{#if errors?.cadUrl}<p class="error">{errors.cadUrl}</p>{/if}
	</div>

	<p class="muted hint">PNG, JPG, WebP or PDF, up to 20 MB. Challenges stay hidden until their week starts.</p>

	<button class="btn" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
</form>

<style>
	form {
		display: grid;
		gap: 1.1rem;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 1rem;
	}

	@media (max-width: 640px) {
		.row {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	input[type='file'] {
		padding: 0.45rem;
		color: var(--fg-muted);
	}

	input[type='file']::file-selector-button {
		background: transparent;
		color: var(--fg);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.3rem 0.7rem;
		margin-right: 0.75rem;
		font: inherit;
		cursor: pointer;
	}

	.current {
		margin: 0 0 0.4rem;
		font-size: 0.85rem;
		color: var(--fg-muted);
	}

	.inline {
		display: inline-flex;
		gap: 0.3rem;
		align-items: center;
		font-weight: 400;
		margin-left: 0.5rem;
	}

	.inline input {
		width: auto;
	}

	.hint {
		font-size: 0.85rem;
		margin: 0;
	}

	button {
		justify-self: start;
	}

	button:disabled {
		opacity: 0.6;
	}
</style>
