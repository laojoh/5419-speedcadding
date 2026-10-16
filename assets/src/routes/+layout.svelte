<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Logo from '#lib/components/Logo.svelte';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: '/', label: 'This week' },
		{ href: '/archive', label: 'Archive' },
		{ href: '/rankings', label: 'Rankings' }
	];
	const active = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600;800&display=swap"
	/>
	<title>5419 Speedcadding</title>
</svelte:head>

<header>
	<div class="container bar">
		<a href="/" class="brand" aria-label="5419 Speedcadding home">
			<Logo />
			<span class="name">Speedcadding</span>
		</a>
		<nav>
			{#each links as link}
				<a href={link.href} class:active={active(link.href)}>{link.label}</a>
			{/each}
			<a href="/submit" class="btn small">Submit</a>
		</nav>
	</div>
</header>

<main>
	{@render children()}
</main>

<footer class="container muted">
	<a href="https://team5419.org">FRC Team 5419 Berkelium</a>
</footer>

<style>
	header {
		border-bottom: 1px solid var(--border);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 64px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		text-decoration: none;
	}

	.name {
		font-weight: 600;
	}

	nav {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		font-size: 0.9rem;
	}

	nav a:not(.btn) {
		text-decoration: none;
		color: var(--fg-muted);
	}

	nav a:not(.btn):hover,
	nav a.active {
		color: var(--fg);
	}

	@media (max-width: 560px) {
		.name {
			display: none;
		}

		nav {
			gap: 0.9rem;
		}
	}

	main {
		min-height: calc(100vh - 130px);
	}

	footer {
		padding-top: 1.5rem;
		padding-bottom: 2rem;
		font-size: 0.8rem;
	}

	footer a {
		text-decoration: none;
	}
</style>
