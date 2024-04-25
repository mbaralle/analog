<script lang="ts">
	import { description, subtitle, title } from '$lib/stores';
</script>

<header>
	<div class="header-avatar">
		<img class="avatar" src="/img/logo.jpg" alt={$title} />
	</div>

	<h1><a href="/" title={$title}>{$title}</a></h1>
	<h2>{$subtitle}</h2>

	<p class="header-desc">{$description}</p>
</header>

<style>
	header {
		text-align: center;
	}

	.avatar {
		margin: 0 auto;
		height: 126px;
		width: 126px;
		border-radius: 50%;
	}

	h1,
	h2 {
		font-family: 'Montserrat Alternates', sans-serif;
		font-weight: 600;
		font-style: normal;
	}

	h1 {
		margin-top: 30px;
	}

	h1 > a {
		margin-top: 30px;
		opacity: 1;
		font-size: 24px;
	}

	h1 > a:hover {
		opacity: 0.5;
	}

	h2 {
		font-size: 16px;
		font-weight: 400;
	}
</style>
