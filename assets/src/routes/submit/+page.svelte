<script lang="ts">
	import { page } from '$app/state';

	const challenge = $derived(page.url.searchParams.get('challenge'));
	const formHref = $derived(challenge ? `/submit/form?challenge=${encodeURIComponent(challenge)}` : '/submit/form');
</script>

<svelte:head><title>Before you submit · 5419 Speedcadding</title></svelte:head>

<div class="container page narrow">
	<h1>Before you submit</h1>
	<p class="muted">Your time is the length of your video, so it has to start and end in the right place.</p>

	<ol class="steps">
		<li>
			<h2>Start recording right before the sketch window opens</h2>
			<p>The sketch window is the one that pops up in the top left. The video should start just before it appears.</p>
		</li>
		<li>
			<h2>Stop the moment the model is done</h2>
			<p>End on the last line drawn, the last mate set, or the last number typed in. Nothing after that.</p>
		</li>
		<li>
			<h2>Upload and trim it in YouTube Studio</h2>
			<p>
				Upload the full-length recording to YouTube, Unlisted (or public if you'd like). Then use the trim tool in YouTube Studio's editor to cut the
				start and end.
			</p>
		</li>
	</ol>

	<div class="rejections">
		<h2>Your run may be rejected if</h2>
		<ul>
			<li>The video starts too early, well before the sketch opens</li>
			<li>The video ends too late, after the model is done</li>
			<li>The video starts late and misses the sketch opening</li>
			<li>The video stops early, before the model is done</li>
		</ul>
		<p class="muted">The first two only add time to your run, so there's no reason to do them.</p>
	</div>

	<a class="btn" href={formHref}>Got it, submit my run →</a>
</div>

<style>
	.narrow {
		max-width: 620px;
	}

	.steps {
		list-style: none;
		counter-reset: step;
		padding: 0;
		margin: 2rem 0;
	}

	.steps li {
		counter-increment: step;
		position: relative;
		padding: 0 0 1.5rem 2.75rem;
	}

	.steps li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: 0;
		width: 1.75rem;
		height: 1.75rem;
		display: grid;
		place-items: center;
		border: 1px solid var(--border);
		border-radius: 50%;
		font: 600 0.85rem var(--font-mono);
		color: var(--fg-muted);
	}

	.steps h2 {
		font-size: 1rem;
		margin: 0.2rem 0 0.25rem;
	}

	.steps p {
		margin: 0;
		color: var(--fg-muted);
	}

	.rejections {
		border-left: 2px solid var(--primary);
		padding: 0.25rem 0 0.25rem 1.25rem;
		margin-bottom: 2rem;
	}

	.rejections h2 {
		font-size: 1rem;
	}

	.rejections ul {
		margin: 0.5rem 0;
		padding-left: 1.1rem;
	}

	.rejections li {
		margin-bottom: 0.25rem;
	}

	.rejections p {
		font-size: 0.9rem;
		margin: 0.5rem 0 0;
	}
</style>
