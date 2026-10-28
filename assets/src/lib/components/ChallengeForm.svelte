<script lang="ts">
	import { enhance } from '$app/forms';
	import { DIFFICULTIES, MAX_PARTS, type Challenge } from '#lib/challenges.ts';

	interface Props {
		action: string;
		submitLabel: string;
		defaults: { title: string; difficulty: string; week: string; cadUrl: string; description: string };
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
		<label for="drawings">Technical drawings <span class="muted">(one per part, up to {MAX_PARTS})</span></label>
		{#if existing?.drawings.length}
			<ul class="current">
				{#each existing.drawings as path, i (path)}
					<li>
						<a href={path} target="_blank" rel="noopener noreferrer">Part {i + 1}</a>
						<label class="inline"><input type="checkbox" name="removeDrawing" value={path} /> remove</label>
					</li>
				{/each}
			</ul>
		{/if}
		<input
			id="drawings"
			name="drawings"
			type="file"
			multiple
			accept="image/png,image/jpeg,image/webp,application/pdf"
			required={!existing}
		/>
		<p class="current">
			{existing ? 'Choose files to add more parts.' : 'Select several files at once for multi-part challenges, in part order.'}
		</p>
		{#if errors?.drawings}<p class="error">{errors.drawings}</p>{/if}
	</div>

	<div>
		<label for="assemblyDrawing">Assembly drawing <span class="muted">(optional)</span></label>
		{#if existing?.assemblyDrawing}
			<p class="current">
				Current: <a href={existing.assemblyDrawing} target="_blank" rel="noopener noreferrer">view</a>
				<label class="inline"><input type="checkbox" name="removeAssembly" /> remove</label>
			</p>
		{/if}
		<input id="assemblyDrawing" name="assemblyDrawing" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
		{#if errors?.assemblyDrawing}<p class="error">{errors.assemblyDrawing}</p>{/if}
	</div>

	<div>
		<label for="description">Description <span class="muted">(optional)</span></label>
		<textarea
			id="description"
			name="description"
			rows="3"
			maxlength="1000"
			placeholder="Units, which features matter, anything runners should know"
		>{defaults.description}</textarea>
		{#if errors?.description}<p class="error">{errors.description}</p>{/if}
	</div>

	<div>
		<label for="cadUrl">CAD link <span class="muted">(optional)</span></label>
		<input id="cadUrl" name="cadUrl" type="url" placeholder="https://cad.onshape.com/documents/…" value={defaults.cadUrl} />
		{#if errors?.cadUrl}<p class="error">{errors.cadUrl}</p>{/if}
	</div>

	<p class="muted hint">PNG, JPG, WebP or PDF, up to 4 MB for all files together. On the live site, new drawings appear after Vercel redeploys (about a minute). Challenges stay hidden until their week starts.</p>

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

	ul.current {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
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
