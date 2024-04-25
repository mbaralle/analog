<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { title } from '$lib/stores';

	import BackButton from './BackButton.svelte';
	import Copyright from './Copyright.svelte';
	import Header from './Header.svelte';
	// import Navigation from './Navigation.svelte';

	let loading: boolean = true;

	beforeNavigate(() => (loading = true));
	afterNavigate(() => setTimeout(() => (loading = false), 300));

	let permalinkPage = false;
	$: permalinkPage = $page?.url.pathname !== '/';
</script>

<div class="load-wrapper" class:hidden={!loading}>
	<div class="header-overlay">
		<img
			class={loading ? 'logo svg pulse' : 'hidden'}
			src="/img/mbaralle-logo-omg.svg"
			alt={$title}
		/>
	</div>
</div>
<section id="wrapper" class="wrapper" class:fade-in={!loading}>
	{#if permalinkPage}
		<BackButton />
	{:else}
		<Header />
		<!-- <Navigation /> -->
	{/if}
	<slot />
	<Copyright />
</section>

<style>
	.load-wrapper {
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background: #fff;
		z-index: 999;
		position: fixed;
		-webkit-transition: opacity 0.2s ease-in;
		-ms-transition: opacity 0.2s ease-in;
		transition: opacity 0.2s ease-in;
	}

	.load-wrapper.hidden {
		opacity: 0;
		pointer-events: none;
	}

	img.hidden {
		display: none;
	}

	.header-overlay {
		position: fixed;
		top: 50%;
		left: 50%;
		width: 65px;
		-webkit-transform: translate(-50%, -50%);
		-ms-transform: translate(-50%, -50%);
		transform: translate(-50%, -50%);
		z-index: 9999;
	}

	.logo.svg {
		top: 50%;
		pointer-events: none;
		position: relative;
	}

	.pulse {
		animation: pulse 1s infinite alternate;
	}

	@keyframes pulse {
		0% {
			opacity: 0;
			-webkit-transform: scale(0.9);
			transform: scale(0.9);
		}

		100% {
			opacity: 1;
			-webkit-transform: scale(1);
			transform: scale(1);
		}
	}

	.wrapper {
		margin: 0 auto;
		opacity: 0;
		padding: 25px 0;
		-webkit-transition: all 0.2s;
		transition: all 0.2s;
	}

	.wrapper.fade-in {
		opacity: 1;
	}

	@media only screen and (min-width: 768px) {
		.wrapper {
			padding: 50px 0;
		}
	}
</style>
