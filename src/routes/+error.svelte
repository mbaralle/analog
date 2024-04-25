<script>
	import { page } from '$app/stores';
	import { pageTitle } from '$lib/stores';
</script>

<svelte:head>
	<title>{$page.error?.message} - {$pageTitle}</title>
</svelte:head>

<div id="error">
	<img id="error-image" src="/img/instamatic-404.png" alt="Error" />
	<div id="error-message">{$page.status} {$page.error?.message}</div>
	<a href="/" title="Home">Back to the home page</a>
</div>

<style>
	#error {
		margin-top: 100px;
		text-align: center;
	}
	#error-image {
		animation: error-color 3s linear infinite;
		width: 250px;
		max-width: 50%;
	}
	#error-message {
		font-size: 1.5em;
	}
	#error a {
		opacity: 0.5;
	}
	#error a:hover {
		opacity: 1;
	}

	@keyframes error-color {
		0% {
			filter: grayscale(50%) saturate(1000%);
		}
		100% {
			filter: grayscale(50%) saturate(1000%) hue-rotate(360deg);
		}
	}
</style>
