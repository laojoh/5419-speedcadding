<script lang="ts" module>
	// Minimal typings for the YouTube IFrame Player API.
	interface YTPlayer {
		getDuration(): number;
		getCurrentTime(): number;
		seekTo(seconds: number, allowSeekAhead: boolean): void;
		pauseVideo(): void;
		destroy(): void;
	}

	declare global {
		interface Window {
			YT?: { Player: new (el: HTMLElement, options: object) => YTPlayer };
			onYouTubeIframeAPIReady?: () => void;
		}
	}

	let apiLoading: Promise<void> | undefined;

	/** Loads the IFrame API script once and resolves when YT.Player is usable. */
	function loadApi() {
		if (window.YT?.Player) return Promise.resolve();
		apiLoading ??= new Promise((resolve) => {
			const previous = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = () => {
				previous?.();
				resolve();
			};
			const script = document.createElement('script');
			script.src = 'https://www.youtube.com/iframe_api';
			document.head.append(script);
		});
		return apiLoading;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { formatTime } from '#lib/time.ts';

	interface Props {
		videoId: string;
		claimedMs: number;
		/** id of the approve <form>, so the official time input submits with it. */
		formId: string;
		error?: string;
	}

	let { videoId, claimedMs, formId, error }: Props = $props();

	const FRAME = 1 / 30;

	let el: HTMLDivElement;
	let player: YTPlayer | undefined;
	let duration = $state(0);
	let current = $state(0);
	let start = $state<number | null>(null);
	let end = $state<number | null>(null);
	let official = $state('');

	const measuredMs = $derived(start !== null && end !== null && end > start ? Math.round((end - start) * 1000) : null);
	const durationMs = $derived(duration > 0 ? Math.round(duration * 1000) : null);

	function diff(ms: number) {
		const d = (ms - claimedMs) / 1000;
		return `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}s vs claimed`;
	}

	function mark(which: 'start' | 'end') {
		if (!player) return;
		const t = player.getCurrentTime();
		if (which === 'start') start = t;
		else end = t;
	}

	function step(frames: number) {
		if (!player) return;
		player.pauseVideo();
		player.seekTo(Math.max(0, player.getCurrentTime() + frames * FRAME), true);
	}

	function useWholeVideo() {
		if (!duration) return;
		start = 0;
		end = duration;
	}

	// Keep the official time in sync with the marks; the admin can still type over it.
	$effect(() => {
		if (measuredMs !== null) official = formatTime(measuredMs);
	});

	onMount(() => {
		let destroyed = false;
		const readDuration = () => {
			const d = player?.getDuration() ?? 0;
			if (d > 0) duration = d;
		};
		loadApi().then(() => {
			if (destroyed) return;
			player = new window.YT!.Player(el, {
				videoId,
				host: 'https://www.youtube-nocookie.com',
				playerVars: { rel: 0, playsinline: 1 },
				events: { onReady: readDuration, onStateChange: readDuration }
			});
		});
		// YouTube reports a rounded duration until the video has loaded, so keep re-reading it.
		const tick = setInterval(() => {
			if (!player?.getCurrentTime) return;
			current = player.getCurrentTime();
			readDuration();
		}, 100);
		return () => {
			destroyed = true;
			clearInterval(tick);
			player?.destroy();
		};
	});
</script>

<div class="tool">
	<div class="frame"><div bind:this={el}></div></div>

	<div class="controls">
		<span class="mono now">{formatTime(Math.round(current * 1000))}</span>
		<button type="button" class="btn ghost small" onclick={() => step(-1)} title="Back one frame">◀ frame</button>
		<button type="button" class="btn ghost small" onclick={() => step(1)} title="Forward one frame">frame ▶</button>
		<button type="button" class="btn ghost small" onclick={() => mark('start')}>Mark start</button>
		<button type="button" class="btn ghost small" onclick={() => mark('end')}>Mark end</button>
	</div>

	<dl>
		<dt>Claimed</dt>
		<dd class="mono">{formatTime(claimedMs)}</dd>

		<dt>Video length</dt>
		<dd class="mono">
			{#if durationMs}
				{formatTime(durationMs)} <span class="muted">{diff(durationMs)}</span>
				<button type="button" class="link" onclick={useWholeVideo}>use</button>
			{:else}
				<span class="muted">loading…</span>
			{/if}
		</dd>

		<dt>Marked</dt>
		<dd class="mono">
			{#if measuredMs !== null}
				{formatTime(measuredMs)} <span class="muted">{diff(measuredMs)}</span>
			{:else}
				<span class="muted">
					{start !== null ? `start ${formatTime(Math.round(start * 1000))}` : 'no start'} ·
					{end !== null ? `end ${formatTime(Math.round(end * 1000))}` : 'no end'}
				</span>
			{/if}
		</dd>
	</dl>

	<label for="official-{formId}">Official time</label>
	<input
		id="official-{formId}"
		name="time"
		form={formId}
		class="mono"
		placeholder="{formatTime(claimedMs)} (blank keeps the claimed time)"
		bind:value={official}
	/>
	{#if error}<p class="error">{error}</p>{/if}
	<p class="hint muted">
		Pause on the frame the sketch window opens and click Mark start, then on the last line, mate or number and click
		Mark end. Clicking the video and pressing <kbd>,</kbd> / <kbd>.</kbd> also steps frames.
	</p>
</div>

<style>
	.tool {
		display: grid;
		gap: 0.6rem;
	}

	.frame {
		aspect-ratio: 16 / 9;
		background: #000;
		border-radius: 4px;
		overflow: hidden;
	}

	.frame :global(iframe) {
		width: 100%;
		height: 100%;
		border: 0;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
	}

	.now {
		min-width: 5.5rem;
		font-size: 0.95rem;
	}

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.2rem 1rem;
		margin: 0.25rem 0;
		font-size: 0.9rem;
	}

	dt {
		color: var(--fg-muted);
	}

	dd {
		margin: 0;
	}

	dd .link {
		margin-left: 0.4rem;
		font-size: 0.85rem;
	}

	label {
		margin: 0.25rem 0 0;
	}

	.hint {
		font-size: 0.8rem;
		margin: 0;
	}

	kbd {
		font-family: var(--font-mono);
		border: 1px solid var(--border);
		border-radius: 3px;
		padding: 0 0.3rem;
	}
</style>
