<script lang="ts">
	import ChallengeForm from '#lib/components/ChallengeForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const c = $derived(data.challenge);
</script>

<a class="back muted" href="/admin/challenges">← Challenges</a>
<h2>Edit {c.title}</h2>

<ChallengeForm
	action=""
	submitLabel="Save changes"
	existing={c}
	defaults={form?.values ?? { title: c.title, difficulty: c.difficulty, week: c.week, cadUrl: c.cadUrl }}
	errors={form?.errors}
/>

<style>
	.back {
		text-decoration: none;
		font-size: 0.9rem;
	}

	h2 {
		margin: 0.75rem 0 1.25rem;
	}
</style>
