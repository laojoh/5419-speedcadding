<script lang="ts">
	// Periodic-table "Bk" tile, the Berkelium 5419 mark from team5419.org
	let { size = 34 }: { size?: number } = $props();
</script>

<div class="tile" style:width="{size}px" style:height="{size}px" style:--s={size / 34} aria-hidden="true">
	<span class="num">5419</span>
	<span class="sym">Bk</span>
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: calc(3px * var(--s)) calc(4px * var(--s)) calc(4px * var(--s));
		border: 1.5px solid var(--primary);
		border-radius: 4px;
		color: var(--primary-soft);
		font-family: var(--font-mono);
		flex-shrink: 0;
	}

	.num {
		font-size: calc(7px * var(--s));
		font-weight: 600;
		line-height: 1;
	}

	.sym {
		align-self: center;
		font-size: calc(16px * var(--s));
		font-weight: 800;
		line-height: 1;
	}
</style>
