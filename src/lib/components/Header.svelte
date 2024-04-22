<script lang="ts">
	import { description, title } from '$lib/stores';
</script>

<header>
	<div class="header-avatar">
		<img class="avatar" src="/img/logo.jpg" alt={$title} />
	</div>

	<h1 class="head-title"><a href="/" title={$title}>{$title}</a></h1>

	<p class="header-desc">{$description}</p>
</header>

<style>
	.head-title {
		margin: 30px 0 0 0;
	}

	.head-title > a {
		opacity: 1;
	}

	.avatar {
		margin: 0 auto;
		height: 126px;
		width: 126px;
		border-radius: 50%;
	}

	h1.head-title a {
		font-size: 24px;
	}

	.head-title,
	.header-avatar,
	.header-desc {
		width: 100%;
		text-align: center;
	}

	.head-title,
	.header-avatar,
	.header-desc {
		position: relative;
	}
</style>
