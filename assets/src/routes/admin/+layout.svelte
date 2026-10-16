<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head><title>Admin · 5419 Speedcadding</title></svelte:head>

<div class="container page">
	{#if data.authed}
		<div class="subnav">
			<a href="/admin" class:active={page.url.pathname === '/admin'}>Runs</a>
			<a href="/admin/challenges" class:active={page.url.pathname.startsWith('/admin/challenges')}>Challenges</a>
			<form method="POST" action="/admin?/logout" use:enhance class="logout">
				<button class="link">Log out</button>
			</form>
		</div>
	{/if}
	{@render children()}
</div>

<style>
	.subnav {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		border-bottom: 1px solid var(--border);
		margin-bottom: 2rem;
	}

	.subnav a {
		text-decoration: none;
		color: var(--fg-muted);
		padding: 0.75rem 0;
		border-bottom: 2px solid transparent;
	}

	.subnav a.active {
		color: var(--fg);
		border-bottom-color: var(--primary);
	}

	.logout {
		margin-left: auto;
	}
</style>
